import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[UPDATE-ADMIN] Request received:", req.method);
  
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

    console.log("[UPDATE-ADMIN] Session token present:", !!sessionToken);

    if (!sessionToken) {
      console.log("[UPDATE-ADMIN] No session token provided");
      return new Response(
        JSON.stringify({ error: "No session token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate admin session
    console.log("[UPDATE-ADMIN] Validating admin session...");
    const { data: sessionData, error: sessionError } = await supabase.rpc(
      "validate_admin_session",
      { p_token: sessionToken }
    );

    console.log("[UPDATE-ADMIN] Session validation result:", { sessionData, sessionError });

    if (sessionError || !sessionData?.[0]?.is_valid) {
      console.log("[UPDATE-ADMIN] Invalid admin session:", sessionError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid admin session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updatingAdminId = sessionData[0].admin_id;
    console.log("[UPDATE-ADMIN] Updating admin by:", updatingAdminId);
    
    const body = await req.json();
    console.log("[UPDATE-ADMIN] Request body:", JSON.stringify(body));
    
    const { admin_id, display_name, permissions, is_active } = body;

    if (!admin_id) {
      return new Response(
        JSON.stringify({ error: "Admin ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if trying to modify own account's active status
    if (admin_id === updatingAdminId && is_active === false) {
      return new Response(
        JSON.stringify({ error: "You cannot deactivate your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target admin is site owner
    const { data: targetAdmin, error: targetError } = await supabase
      .from("admin_accounts")
      .select("is_site_owner, email")
      .eq("id", admin_id)
      .single();

    if (targetError || !targetAdmin) {
      console.log("[UPDATE-ADMIN] Target admin not found:", targetError?.message);
      return new Response(
        JSON.stringify({ error: "Admin not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetAdmin.is_site_owner) {
      return new Response(
        JSON.stringify({ error: "Site owner account cannot be modified" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) {
      updateData.display_name = display_name;
    }

    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    console.log("[UPDATE-ADMIN] Updating with data:", updateData);

    // Update admin account
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin_accounts")
      .update(updateData)
      .eq("id", admin_id)
      .select("id, email, display_name, is_active, permissions")
      .single();

    if (updateError) {
      console.error("[UPDATE-ADMIN] Update error:", updateError);
      throw updateError;
    }

    console.log("[UPDATE-ADMIN] Successfully updated admin:", updatedAdmin.id);

    // Log the action
    await supabase.rpc("log_admin_panel_action", {
      p_admin_id: updatingAdminId,
      p_action_type: "admin_user_updated",
      p_action_category: "user_management",
      p_description: `Updated admin account: ${targetAdmin.email}`,
      p_severity: is_active === false ? "warning" : "info",
      p_metadata: { 
        target_admin_id: admin_id,
        target_email: targetAdmin.email,
        changes: updateData 
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin account updated successfully",
        admin: updatedAdmin
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[UPDATE-ADMIN] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update admin" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
