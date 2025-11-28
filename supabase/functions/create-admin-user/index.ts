import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin session from request
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

    const creatingAdminId = sessionData[0].admin_id;
    const { action, email, display_name, password, permissions } = await req.json();

    if (!email || !display_name) {
      return new Response(
        JSON.stringify({ error: "Email and display name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from("admin_accounts")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: "An admin with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "invite") {
      // Generate a temporary password for invitation
      const tempPassword = crypto.randomUUID().slice(0, 16);
      const encoder = new TextEncoder();
      const data = encoder.encode(tempPassword);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Create admin account with temporary password
      const { data: newAdmin, error: createError } = await supabase
        .from("admin_accounts")
        .insert({
          email: email.toLowerCase(),
          display_name,
          password_hash: passwordHash,
          permissions: permissions || ["all"],
          created_by: creatingAdminId,
          is_active: true,
          mfa_enabled: false,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Send invitation email via Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const adminPanelUrl = `${req.headers.get("origin")}/admin/login`;
        
        console.log("[CREATE-ADMIN] Sending invitation email to:", email);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Entity Renewal Pro <onboarding@resend.dev>",
            to: [email],
            subject: "You've been invited as an Admin",
            html: `
              <h2>Admin Account Created</h2>
              <p>Hello ${display_name},</p>
              <p>You have been invited to join as an administrator.</p>
              <p><strong>Your temporary password:</strong> ${tempPassword}</p>
              <p>Please login at: <a href="${adminPanelUrl}">${adminPanelUrl}</a></p>
              <p>You will be required to set up MFA on first login.</p>
              <p><em>Please change your password after logging in.</em></p>
            `,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("[CREATE-ADMIN] Email response:", JSON.stringify(emailResult));
        
        if (!emailResponse.ok) {
          console.error("[CREATE-ADMIN] Failed to send email:", emailResult);
        }
      } else {
        console.warn("[CREATE-ADMIN] RESEND_API_KEY not configured, skipping email");
      }

      // Log the action
      await supabase.rpc("log_admin_panel_action", {
        p_admin_id: creatingAdminId,
        p_action_type: "admin_user_invited",
        p_action_category: "user_management",
        p_description: `Invited new admin: ${email}`,
        p_severity: "info",
        p_metadata: { invited_email: email, display_name },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin invitation sent successfully",
          admin: { id: newAdmin.id, email: newAdmin.email, display_name: newAdmin.display_name }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "create") {
      if (!password || password.length < 12) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 12 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash the password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Create admin account
      const { data: newAdmin, error: createError } = await supabase
        .from("admin_accounts")
        .insert({
          email: email.toLowerCase(),
          display_name,
          password_hash: passwordHash,
          permissions: permissions || ["all"],
          created_by: creatingAdminId,
          is_active: true,
          mfa_enabled: false,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Log the action
      await supabase.rpc("log_admin_panel_action", {
        p_admin_id: creatingAdminId,
        p_action_type: "admin_user_created",
        p_action_category: "user_management",
        p_description: `Created new admin: ${email}`,
        p_severity: "info",
        p_metadata: { created_email: email, display_name },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin account created successfully",
          admin: { id: newAdmin.id, email: newAdmin.email, display_name: newAdmin.display_name }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating admin:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create admin" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
