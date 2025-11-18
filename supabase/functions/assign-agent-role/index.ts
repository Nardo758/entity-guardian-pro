import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Assigning agent role to user:', user.id);

    // Check if role already exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'registered_agent')
      .single();

    if (existingRole) {
      console.log('Agent role already exists for user:', user.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Role already assigned' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert agent role using service role (bypasses RLS)
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'registered_agent',
        created_by: user.id
      });

    if (roleError) {
      console.error('Failed to assign agent role:', roleError);
      throw new Error(`Role assignment failed: ${roleError.message}`);
    }

    console.log('Successfully assigned agent role to user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Agent role assigned successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assign-agent-role:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
