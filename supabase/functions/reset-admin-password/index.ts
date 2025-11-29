import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[RESET-ADMIN-PASSWORD] Request received:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.replace("Bearer ", "");

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "No session token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate admin session
    const { data: sessionData, error: sessionError } = await supabase.rpc(
      "validate_admin_session",
      { p_token: sessionToken }
    );

    if (sessionError || !sessionData?.[0]?.is_valid) {
      return new Response(
        JSON.stringify({ error: "Invalid admin session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resettingAdminId = sessionData[0].admin_id;
    
    const body = await req.json();
    const { admin_id, new_password, send_email } = body;

    if (!admin_id) {
      return new Response(
        JSON.stringify({ error: "Admin ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!new_password || new_password.length < 12) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 12 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target admin info
    const { data: targetAdmin, error: targetError } = await supabase
      .from("admin_accounts")
      .select("is_site_owner, email, display_name")
      .eq("id", admin_id)
      .single();

    if (targetError || !targetAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Site owner can only reset their own password
    if (targetAdmin.is_site_owner && admin_id !== resettingAdminId) {
      return new Response(
        JSON.stringify({ error: "Only the site owner can reset their own password" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the new password
    const encoder = new TextEncoder();
    const data = encoder.encode(new_password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Update admin password
    const { error: updateError } = await supabase
      .from("admin_accounts")
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq("id", admin_id);

    if (updateError) {
      console.error("[RESET-ADMIN-PASSWORD] Update error:", updateError);
      throw updateError;
    }

    // Invalidate all sessions for this admin (force re-login)
    await supabase
      .from("admin_sessions")
      .update({ is_valid: false })
      .eq("admin_id", admin_id);

    console.log("[RESET-ADMIN-PASSWORD] Successfully reset password for:", admin_id);

    // Send email notification if requested
    if (send_email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const adminPanelUrl = `${req.headers.get("origin")}/admin/login`;
        
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Entity Renewal Pro <admin@entityrenewalpro.com>",
            to: [targetAdmin.email],
            subject: "Your Admin Password Has Been Reset",
            html: `
              <h2>Password Reset</h2>
              <p>Hello ${targetAdmin.display_name},</p>
              <p>Your admin account password has been reset by an administrator.</p>
              <p><strong>Your new temporary password:</strong> ${new_password}</p>
              <p>Please login at: <a href="${adminPanelUrl}">${adminPanelUrl}</a></p>
              <p><em>We recommend changing your password after logging in.</em></p>
            `,
          }),
        });
      }
    }

    // Log the action
    await supabase.rpc("log_admin_panel_action", {
      p_admin_id: resettingAdminId,
      p_action_type: "admin_password_reset",
      p_action_category: "security",
      p_description: `Reset password for admin: ${targetAdmin.email}`,
      p_severity: "warning",
      p_metadata: { 
        target_admin_id: admin_id,
        target_email: targetAdmin.email,
        email_sent: send_email || false
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[RESET-ADMIN-PASSWORD] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to reset password" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
