import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  notification_id: string;
  user_email: string;
  title: string;
  message: string;
  notification_type: string;
  entity_name?: string;
  due_date?: string;
  amount?: number;
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

    const {
      notification_id,
      user_email,
      title,
      message,
      notification_type,
      entity_name,
      due_date,
      amount
    }: EmailNotificationRequest = await req.json();

    console.log(`Sending email notification ${notification_id} to ${user_email}`);

    // Generate email content based on notification type
    let emailSubject = title;
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">Entity Renewal Pro</h1>
        </div>
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">${message}</p>
    `;

    if (notification_type === 'renewal_reminder' && entity_name) {
      emailHtml += `
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">Renewal Details</h3>
            <p><strong>Entity:</strong> ${entity_name}</p>
            ${due_date ? `<p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>` : ''}
            ${amount ? `<p><strong>Amount:</strong> $${amount.toFixed(2)}</p>` : ''}
          </div>
      `;
    } else if (notification_type === 'payment_due' && entity_name) {
      emailHtml += `
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #f57c00; margin-top: 0;">Payment Details</h3>
            <p><strong>Entity:</strong> ${entity_name}</p>
            ${due_date ? `<p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>` : ''}
            ${amount ? `<p><strong>Amount:</strong> $${amount.toFixed(2)}</p>` : ''}
          </div>
      `;
    }

    emailHtml += `
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://wcuxqopfcgivypbiynjp.supabase.co" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            You're receiving this email because you have notifications enabled in your Entity Renewal Pro account.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Entity Renewal Pro <notifications@resend.dev>",
      to: [user_email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update notification status in database
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        email_sent: true,
        sent_at: new Date().toISOString()
      })
      .eq('id', notification_id);

    if (updateError) {
      console.error('Error updating notification status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResponse.data?.id,
        notification_id 
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
    console.error("Error in send-email-notification function:", error);

    // Update notification with error info
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { notification_id } = await req.json();
      
      await supabase
        .from('notifications')
        .update({
          retry_count: supabase.raw('retry_count + 1'),
          metadata: supabase.raw(`metadata || '{"error": "${error.message}"}'::jsonb`)
        })
        .eq('id', notification_id);
    } catch (updateError) {
      console.error('Error updating notification error status:', updateError);
    }

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