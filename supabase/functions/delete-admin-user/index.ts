import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[DELETE-ADMIN] Request received:", req.method);
  
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

    const deletingAdminId = sessionData[0].admin_id;
    
    const body = await req.json();
    const { admin_id } = body;

    if (!admin_id) {
      return new Response(
        JSON.stringify({ error: "Admin ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cannot delete yourself
    if (admin_id === deletingAdminId) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
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

    // Cannot delete site owner
    if (targetAdmin.is_site_owner) {
      return new Response(
        JSON.stringify({ error: "Site owner account cannot be deleted" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidate all sessions for this admin
    await supabase
      .from("admin_sessions")
      .update({ is_valid: false })
      .eq("admin_id", admin_id);

    // Delete the admin account
    const { error: deleteError } = await supabase
      .from("admin_accounts")
      .delete()
      .eq("id", admin_id);

    if (deleteError) {
      console.error("[DELETE-ADMIN] Delete error:", deleteError);
      throw deleteError;
    }

    console.log("[DELETE-ADMIN] Successfully deleted admin:", admin_id);

    // Log the action
    await supabase.rpc("log_admin_panel_action", {
      p_admin_id: deletingAdminId,
      p_action_type: "admin_user_deleted",
      p_action_category: "user_management",
      p_description: `Deleted admin account: ${targetAdmin.email}`,
      p_severity: "warning",
      p_metadata: { 
        deleted_admin_id: admin_id,
        deleted_email: targetAdmin.email,
        deleted_name: targetAdmin.display_name
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin account deleted successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[DELETE-ADMIN] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete admin" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
