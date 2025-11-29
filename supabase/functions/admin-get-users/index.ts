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

    // Validate admin session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionToken = authHeader.replace("Bearer ", "");
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

    const { type } = await req.json();

    if (type === "admin_accounts") {
      // Fetch admin accounts from dedicated admin_accounts table
      const { data: adminAccounts, error } = await supabase
        .from("admin_accounts")
        .select("id, email, display_name, is_active, created_at, permissions, mfa_enabled, last_login_at, is_site_owner")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ adminAccounts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "all_users") {
      // Fetch all profiles with their subscription data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch subscribers data
      const { data: subscribers, error: subscribersError } = await supabase
        .from("subscribers")
        .select("user_id, subscription_tier, subscription_status, subscribed, trial_end, is_trial_active");

      if (subscribersError) throw subscribersError;

      // Create maps for quick lookup
      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const subscribersMap = new Map(subscribers?.map((s) => [s.user_id, s]) || []);

      // Combine data
      const users = profiles?.map((profile) => ({
        ...profile,
        roles: rolesMap.get(profile.user_id) || [],
        subscription: subscribersMap.get(profile.user_id) || null,
      })) || [];

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid request type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
