import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  type?: 'signup' | 'invite' | 'recovery' | 'magic_link' | 'email_change';
  token?: string;
  redirect_to?: string;
  site_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Auth email function called');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const emailData: AuthEmailRequest = await req.json();
    console.log('Auth email request:', { ...emailData, html: emailData.html ? '[HTML_CONTENT]' : undefined });

    const { to, subject, html, text, type, token, redirect_to, site_url } = emailData;

    if (!to || !subject) {
      throw new Error("Missing required fields: to, subject");
    }

    // Generate email content based on type
    let emailHtml = html;
    let emailSubject = subject;

    if (type === 'signup' && token) {
      emailSubject = "Welcome! Please confirm your email";
      const confirmUrl = `${site_url}/auth/v1/verify?token=${token}&type=signup${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to Entity Renewal Pro!</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Thank you for signing up as a Registered Agent. To complete your registration, please confirm your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" 
                 style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Confirm Email Address
              </a>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${confirmUrl}" style="color: #1976d2; word-break: break-all;">${confirmUrl}</a>
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'recovery' && token) {
      emailSubject = "Reset your password";
      const resetUrl = `${site_url}/auth/v1/verify?token=${token}&type=recovery${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              You requested to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #1976d2; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `;
    }

    console.log('Sending auth email with Resend...');
    const emailResponse = await resend.emails.send({
      from: "Entity Renewal Pro <auth@resend.dev>", // Change this to your verified domain
      to: [to],
      subject: emailSubject,
      html: emailHtml || text || "Email content not provided",
    });

    console.log("Auth email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Auth email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
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