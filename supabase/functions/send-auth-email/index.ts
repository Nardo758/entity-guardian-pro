import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Resend client will be initialized lazily inside the handler after validating API key

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupabaseAuthHookPayload {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'invite' | 'magic_link' | 'email_change';
    site_url?: string;
    [key: string]: any;
  };
  [key: string]: any;
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
    const payload: SupabaseAuthHookPayload = await req.json();
    console.log('Auth email request:', payload);
    const { user, email_data } = payload;

    // Validate required fields from Supabase auth hook payload
    if (!user?.email || !email_data?.email_action_type) {
      throw new Error("Missing required fields: user.email or email_data.email_action_type");
    }

    const to = user.email;
    const type = email_data.email_action_type;
    const token = email_data.token; // 6-digit OTP, not for verify link
    const tokenHash = email_data.token_hash; // use this in verify link
    const raw_site_url = (email_data.site_url?.replace(/\/+$/, '') || 'https://wcuxqopfcgivypbiynjp.supabase.co');
    // Normalize so we always append /auth/v1 ourselves (avoid double /auth/v1)
    const site_url = raw_site_url.replace(/\/auth\/v1\/?$/, ''); // Base URL without /auth/v1
    const redirectBase = (email_data.redirect_to?.replace(/\/?$/, '') || 'https://entityrenewalpro.com');

    console.log('Token received:', token);
    console.log('Token hash received:', tokenHash);
    console.log('Email action type:', type);
    console.log('Site URL:', site_url);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    const resend = new Resend(resendApiKey);
    // Note: No apikey needed in verify URL

    // Generate email content based on type
    let emailHtml: string;
    let emailSubject: string;

    if (type === 'signup' && (tokenHash || token)) {
      emailSubject = "Welcome! Please confirm your email";
      // Send user to frontend page that will call supabase.auth.verifyOtp
      const confirmUrl = `${redirectBase}/verify-email?type=signup&token_hash=${encodeURIComponent(tokenHash || '')}&email=${encodeURIComponent(to)}`;
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
    } else if (type === 'recovery' && (tokenHash || token)) {
      emailSubject = "Reset your password";
      const resetUrl = `${redirectBase}/verify-email?type=recovery&token_hash=${encodeURIComponent(tokenHash || '')}&email=${encodeURIComponent(to)}`;
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
    } else {
      // Default case for other email types
      emailSubject = `${type} - Entity Renewal Pro`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
          </div>
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Account Notification</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              You have received this notification regarding your Entity Renewal Pro account.
            </p>
            ${(tokenHash || token) ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${redirectBase}/verify-email?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(tokenHash || '')}&email=${encodeURIComponent(to)}" 
                 style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email
              </a>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    console.log('Sending auth email with Resend...');
    const emailResponse = await resend.emails.send({
      from: "Entity Renewal Pro <team@entityrenewalpro.com>", 
      to: [to],
      subject: emailSubject,
      html: emailHtml || "Email content not provided",
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