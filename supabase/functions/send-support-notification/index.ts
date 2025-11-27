import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportNotificationRequest {
  ticketId: string;
  message: string;
  isResolution?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Support notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ticketId, message, isResolution = false }: SupportNotificationRequest = await req.json();
    console.log(`Processing notification for ticket: ${ticketId}, isResolution: ${isResolution}`);

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("Error fetching ticket:", ticketError);
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user's email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ticket.user_id);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending notification to: ${userEmail}`);

    // Get user's name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", ticket.user_id)
      .single();

    const userName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Valued Customer'
      : 'Valued Customer';

    const subject = isResolution 
      ? `Your Support Ticket Has Been Resolved - #${ticketId.slice(0, 8)}`
      : `New Response to Your Support Ticket - #${ticketId.slice(0, 8)}`;

    const emailHtml = isResolution
      ? `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✓ Ticket Resolved</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Hello ${userName},</p>
              <p>Your support ticket <strong>#${ticketId.slice(0, 8)}</strong> regarding "<strong>${ticket.subject}</strong>" has been resolved.</p>
              
              <div style="background: white; border: 1px solid #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: 600; color: #059669; margin-bottom: 8px;">Resolution Notes:</p>
                <p style="margin: 0; color: #555;">${message}</p>
              </div>
              
              <p>If you have any further questions or if the issue persists, please don't hesitate to open a new ticket.</p>
              
              <p style="margin-bottom: 0;">Thank you for your patience,<br><strong>Support Team</strong></p>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Response</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin-top: 0;">Hello ${userName},</p>
              <p>You have received a new response to your support ticket <strong>#${ticketId.slice(0, 8)}</strong> regarding "<strong>${ticket.subject}</strong>".</p>
              
              <div style="background: white; border: 1px solid #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: 600; color: #2563eb; margin-bottom: 8px;">Support Response:</p>
                <p style="margin: 0; color: #555; white-space: pre-wrap;">${message}</p>
              </div>
              
              <p>You can view the full conversation and respond by logging into your account.</p>
              
              <p style="margin-bottom: 0;">Best regards,<br><strong>Support Team</strong></p>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </body>
        </html>
      `;

    const emailResponse = await resend.emails.send({
      from: "Support <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-notification function:", error);
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
