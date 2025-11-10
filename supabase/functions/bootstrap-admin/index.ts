import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BootstrapRequest {
  targetEmail?: string; // Optional: bootstrap a specific email instead of current user
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Authentication required to bootstrap admin' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Invalid authentication token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Bootstrap admin request from user: ${user.id} (${user.email})`);

    // Parse request body
    let targetEmail: string | undefined;
    if (req.method === 'POST') {
      const body: BootstrapRequest = await req.json();
      targetEmail = body.targetEmail;
    }

    // CRITICAL SECURITY CHECK: Verify no admins exist yet
    const { data: existingAdmins, error: checkError } = await supabase
      .from('user_roles')
      .select('id, user_id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          message: 'Failed to verify admin status' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If any admin exists, reject the request
    if (existingAdmins && existingAdmins.length > 0) {
      console.warn('Bootstrap attempt rejected - admin already exists');
      
      // Log security event
      await supabase.from('analytics_data').insert({
        user_id: user.id,
        metric_name: 'bootstrap_admin_rejected',
        metric_value: 1,
        metric_type: 'security_audit',
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          reason: 'admin_already_exists',
          existing_admin_count: existingAdmins.length,
          attempted_by: user.email,
          target_email: targetEmail,
          timestamp: new Date().toISOString(),
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Bootstrap failed',
          message: 'Admin user already exists. Bootstrap is only allowed for the first admin.',
          locked: true
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determine target user ID
    let targetUserId: string;
    let targetUserEmail: string;

    if (targetEmail) {
      // Look up user by email
      const { data: targetUserData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Error looking up target user:', userError);
        return new Response(
          JSON.stringify({ 
            error: 'User lookup failed',
            message: 'Could not find target user' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const targetUser = targetUserData.users.find(u => u.email === targetEmail);
      
      if (!targetUser) {
        console.error(`Target user not found: ${targetEmail}`);
        return new Response(
          JSON.stringify({ 
            error: 'User not found',
            message: `No user found with email: ${targetEmail}` 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      targetUserId = targetUser.id;
      targetUserEmail = targetEmail;
      console.log(`Bootstrapping specific user: ${targetEmail}`);
    } else {
      // Bootstrap the current user
      targetUserId = user.id;
      targetUserEmail = user.email || 'unknown';
      console.log(`Bootstrapping current user: ${user.email}`);
    }

    // Create the first admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUserId,
        role: 'admin',
        created_by: user.id, // Track who performed the bootstrap
      });

    if (insertError) {
      console.error('Error creating admin role:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create admin',
          message: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log successful bootstrap
    await supabase.from('analytics_data').insert({
      user_id: user.id,
      metric_name: 'bootstrap_admin_success',
      metric_value: 1,
      metric_type: 'security_audit',
      metric_date: new Date().toISOString().split('T')[0],
      metadata: {
        target_user_id: targetUserId,
        target_email: targetUserEmail,
        bootstrapped_by: user.email,
        bootstrapped_by_id: user.id,
        timestamp: new Date().toISOString(),
        is_self_bootstrap: targetUserId === user.id,
      }
    });

    console.log(`✅ Admin bootstrap successful for: ${targetUserEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully bootstrapped admin user: ${targetUserEmail}`,
        admin_user_id: targetUserId,
        admin_email: targetUserEmail,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in bootstrap-admin:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
