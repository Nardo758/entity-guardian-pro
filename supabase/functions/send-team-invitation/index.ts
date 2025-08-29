import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TeamInvitationRequest {
  team_id: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
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

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { team_id, email, role }: TeamInvitationRequest = await req.json();

    console.log(`Processing team invitation for ${email} to team ${team_id} as ${role}`);

    // Verify user has permission to invite to this team
    const { data: membership, error: membershipError } = await supabase
      .from('team_memberships')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return new Response('Forbidden: Not a team member', { status: 403, headers: corsHeaders });
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return new Response('Forbidden: Insufficient permissions', { status: 403, headers: corsHeaders });
    }

    // Get team information
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return new Response('Team not found', { status: 404, headers: corsHeaders });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_memberships')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', supabase.auth.admin.getUserByEmail(email).then(u => u.data.user?.id))
      .maybeSingle();

    if (existingMember) {
      return new Response('User is already a team member', { status: 400, headers: corsHeaders });
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', team_id)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvitation) {
      return new Response('Invitation already pending', { status: 400, headers: corsHeaders });
    }

    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invitation_token');
    
    if (tokenError) {
      throw new Error(`Failed to generate token: ${tokenError.message}`);
    }

    const token_value = tokenData as string;

    // Create invitation record
    const { error: invitationError } = await supabase
      .from('team_invitations')
      .insert({
        team_id,
        email,
        role,
        invited_by: user.id,
        token: token_value,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

    if (invitationError) {
      throw invitationError;
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const inviterName = inviterProfile 
      ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim()
      : user.email || 'A team member';

    // Send invitation email
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/accept-team-invitation?token=${token_value}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
        </div>
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Team Invitation</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            ${inviterName} has invited you to join the <strong>${team.name}</strong> team as a ${role}.
          </p>
          ${team.description ? `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; margin: 0;"><strong>About this team:</strong></p>
            <p style="color: #666; margin: 5px 0 0 0;">${team.description}</p>
          </div>
          ` : ''}
          <div style="margin: 30px 0; text-align: center;">
            <a href="${inviteUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This invitation will expire in 7 days. If you don't want to join this team, you can ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link: ${inviteUrl}
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Entity Renewal Pro <invitations@resend.dev>",
      to: [email],
      subject: `Invitation to join ${team.name} team`,
      html: emailHtml,
    });

    console.log("Team invitation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        email_id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);