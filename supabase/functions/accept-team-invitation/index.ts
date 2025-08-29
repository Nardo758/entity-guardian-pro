import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const url = new URL(req.url);
    const token = url.searchParams.get('token') || 
                 (req.method === 'POST' ? (await req.json()).token : null);

    if (!token) {
      return new Response(
        `
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #d32f2f;">Invalid Invitation</h1>
            <p>No invitation token provided.</p>
          </body>
        </html>
        `,
        { 
          status: 400, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    console.log(`Processing team invitation acceptance for token: ${token}`);

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams(*),
        inviter:profiles!invited_by(first_name, last_name)
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return new Response(
        `
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #d32f2f;">Invalid or Expired Invitation</h1>
            <p>This invitation link is invalid or has expired.</p>
            <p><a href="/" style="color: #1976d2;">Go to Entity Renewal Pro</a></p>
          </body>
        </html>
        `,
        { 
          status: 404, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Check if user exists with this email
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(invitation.email);
    
    if (userError || !existingUser.user) {
      // User doesn't exist - show signup page
      const signupUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/register?invitation=${token}`;
      
      return new Response(
        `
        <html>
          <head>
            <title>Join ${invitation.team?.name} - Entity Renewal Pro</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { max-width: 500px; margin: 100px auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; }
              h1 { color: #333; margin-bottom: 20px; }
              .team-name { color: #1976d2; font-weight: bold; }
              .btn { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .btn:hover { background: #1565c0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Welcome to Entity Renewal Pro!</h1>
              <p>You've been invited to join the <span class="team-name">${invitation.team?.name}</span> team as a ${invitation.role}.</p>
              <p>To accept this invitation, you need to create an account first.</p>
              <a href="${signupUrl}" class="btn">Create Account & Join Team</a>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}.
              </p>
            </div>
          </body>
        </html>
        `,
        { 
          status: 200, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    const userId = existingUser.user.id;

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('team_memberships')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMembership) {
      return new Response(
        `
        <html>
          <head>
            <title>Already a Member - Entity Renewal Pro</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { max-width: 500px; margin: 100px auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; }
              h1 { color: #333; margin-bottom: 20px; }
              .btn { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Already a Team Member</h1>
              <p>You're already a member of the ${invitation.team?.name} team.</p>
              <a href="${Deno.env.get('SITE_URL') || 'http://localhost:3000'}" class="btn">Go to Dashboard</a>
            </div>
          </body>
        </html>
        `,
        { 
          status: 200, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Add user to team
    const { error: membershipError } = await supabase
      .from('team_memberships')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by
      });

    if (membershipError) {
      throw membershipError;
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Don't fail if this doesn't work
    }

    console.log(`User ${userId} successfully joined team ${invitation.team_id}`);

    // Success page
    return new Response(
      `
      <html>
        <head>
          <title>Welcome to ${invitation.team?.name} - Entity Renewal Pro</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); }
            .container { max-width: 500px; margin: 100px auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; }
            h1 { color: #4caf50; margin-bottom: 20px; }
            .team-name { color: #1976d2; font-weight: bold; }
            .btn { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .btn:hover { background: #1565c0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to the Team!</h1>
            <p>You have successfully joined the <span class="team-name">${invitation.team?.name}</span> team as a ${invitation.role}.</p>
            <p>You can now access shared entities and collaborate with your team members.</p>
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:3000'}" class="btn">Go to Dashboard</a>
          </div>
        </body>
      </html>
      `,
      { 
        status: 200, 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in accept-team-invitation function:", error);
    
    return new Response(
      `
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #d32f2f;">Error</h1>
          <p>An error occurred while processing your invitation: ${error.message}</p>
          <p><a href="/" style="color: #1976d2;">Go to Entity Renewal Pro</a></p>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

serve(handler);