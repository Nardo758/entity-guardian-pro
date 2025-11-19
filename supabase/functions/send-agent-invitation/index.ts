import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AgentInvitationRequest {
  invitationId: string;
  agentEmail: string;
  entityName: string;
  message?: string;
  ownerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send agent invitation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const {
      invitationId,
      agentEmail,
      entityName,
      message,
      ownerName,
    }: AgentInvitationRequest = await req.json();

    console.log("Processing invitation:", { invitationId, agentEmail, entityName });

    // Get the invitation token from the database
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("agent_invitations")
      .select("token, entity_id")
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      console.error("Error fetching invitation:", invitationError);
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the invitation acceptance URL
    const acceptUrl = `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/agent-invitation-accept?token=${invitation.token}`;

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: 600;
            }
            .message-box {
              background: #f9fafb;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-radius: 0 0 10px 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🤝 New Agent Invitation</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${ownerName}</strong> has invited you to be the registered agent for their entity:</p>
            <h2 style="color: #667eea; margin: 20px 0;">${entityName}</h2>
            
            ${message ? `
              <div class="message-box">
                <strong>Message from ${ownerName}:</strong>
                <p style="margin: 10px 0 0 0;">${message}</p>
              </div>
            ` : ''}
            
            <p>As a registered agent, you will be responsible for receiving legal documents and official correspondence on behalf of this entity.</p>
            
            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">
                View & Respond to Invitation
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              You can accept or decline this invitation by clicking the button above. This invitation is only valid for 30 days.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Entity Management Platform.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Entity Management <onboarding@resend.dev>",
      to: [agentEmail],
      subject: `New Agent Invitation for ${entityName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email sent successfully",
        emailResponse,
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
    console.error("Error in send-agent-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
