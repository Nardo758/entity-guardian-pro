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

    console.log("admin-get-users: Starting request");

    // Validate admin session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("admin-get-users: No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionToken = authHeader.replace("Bearer ", "");
    console.log("admin-get-users: Validating session token");
    
    const { data: sessionData, error: sessionError } = await supabase.rpc(
      "validate_admin_session",
      { p_token: sessionToken }
    );

    console.log("admin-get-users: Session validation result:", { sessionData, sessionError });

    if (sessionError || !sessionData?.[0]?.is_valid) {
      console.log("admin-get-users: Invalid session", { sessionError, sessionData });
      return new Response(
        JSON.stringify({ error: "Invalid admin session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("admin-get-users: Session valid");

    const body = await req.json();
    const { type, action, userId, profileData, role, reason, subscriptionData, tier } = body;
    console.log("admin-get-users: Request type:", type, "action:", action);

    // Handle action-based requests
    if (action) {
      switch (action) {
        case 'update_profile': {
          console.log("admin-get-users: Updating profile for user:", userId);
          const { error } = await supabase
            .from("profiles")
            .update({
              ...profileData,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("admin-get-users: Error updating profile:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case 'add_role': {
          console.log("admin-get-users: Adding role for user:", userId, "role:", role);
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role });

          if (error) {
            console.error("admin-get-users: Error adding role:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case 'remove_role': {
          console.log("admin-get-users: Removing role for user:", userId, "role:", role);
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", role);

          if (error) {
            console.error("admin-get-users: Error removing role:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case 'suspend_user': {
          console.log("admin-get-users: Suspending user:", userId);
          const { error } = await supabase
            .from("profiles")
            .update({
              account_status: "suspended",
              suspended_at: new Date().toISOString(),
              suspension_reason: reason,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("admin-get-users: Error suspending user:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case 'unsuspend_user': {
          console.log("admin-get-users: Unsuspending user:", userId);
          const { error } = await supabase
            .from("profiles")
            .update({
              account_status: "active",
              suspended_at: null,
              suspended_by: null,
              suspension_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("admin-get-users: Error unsuspending user:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case 'update_subscription': {
          console.log("admin-get-users: Updating subscription for user:", userId, subscriptionData);
          const { error } = await supabase
            .from("subscribers")
            .update({
              ...subscriptionData,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("admin-get-users: Error updating subscription:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case 'grant_free_access': {
          console.log("admin-get-users: Granting free access for user:", userId, "tier:", tier);
          
          // Determine entities limit based on tier
          let entitiesLimit = 4;
          if (tier === 'pro') entitiesLimit = 15;
          if (tier === 'unlimited') entitiesLimit = 999;

          const { error } = await supabase
            .from("subscribers")
            .update({
              subscribed: true,
              subscription_tier: tier,
              subscription_status: "active",
              is_trial_active: false,
              entities_limit: entitiesLimit,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("admin-get-users: Error granting free access:", error);
            throw error;
          }

          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: "Invalid action type" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
      }
    }

    // Handle type-based requests (for fetching data)
    if (type === "admin_accounts") {
      console.log("admin-get-users: Fetching admin accounts");
      const { data: adminAccounts, error } = await supabase
        .from("admin_accounts")
        .select("id, email, display_name, is_active, created_at, permissions, mfa_enabled, last_login_at, is_site_owner")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("admin-get-users: Error fetching admin accounts:", error);
        throw error;
      }

      console.log("admin-get-users: Found admin accounts:", adminAccounts?.length);
      return new Response(
        JSON.stringify({ adminAccounts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "all_users") {
      console.log("admin-get-users: Fetching all users");
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("admin-get-users: Error fetching profiles:", profilesError);
        throw profilesError;
      }
      console.log("admin-get-users: Found profiles:", profiles?.length);

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("admin-get-users: Error fetching roles:", rolesError);
        throw rolesError;
      }

      const { data: subscribers, error: subscribersError } = await supabase
        .from("subscribers")
        .select("user_id, email, subscription_tier, subscription_status, subscribed, trial_end, is_trial_active, entities_limit");

      if (subscribersError) {
        console.error("admin-get-users: Error fetching subscribers:", subscribersError);
        throw subscribersError;
      }

      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const subscribersMap = new Map(subscribers?.map((s) => [s.user_id, s]) || []);

      const users = profiles?.map((profile) => ({
        ...profile,
        roles: rolesMap.get(profile.user_id) || [],
        subscription: subscribersMap.get(profile.user_id) || null,
      })) || [];

      console.log("admin-get-users: Returning users:", users.length);
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
