import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'email' | 'sms' | 'push';
  template: string;
  recipients: string[];
  data?: Record<string, any>;
  scheduledFor?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Email templates
const emailTemplates = {
  renewal_reminder: {
    subject: "Entity Renewal Reminder - {{entityName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Entity Renewal Reminder</h2>
        <p>Hello {{ownerName}},</p>
        <p>This is a friendly reminder that your entity <strong>{{entityName}}</strong> has an upcoming renewal deadline.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Entity:</strong> {{entityName}}</p>
          <p><strong>State:</strong> {{state}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Fee:</strong> ${{fee}}</p>
        </div>
        <p>Please ensure this renewal is completed on time to avoid penalties and maintain good standing.</p>
        <a href="{{dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          View in Dashboard
        </a>
        <p>Best regards,<br>EntityRenewal Pro Team</p>
      </div>
    `
  },
  agent_invitation: {
    subject: "Registered Agent Invitation - {{entityName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Registered Agent Invitation</h2>
        <p>Hello,</p>
        <p>You have been invited to serve as the registered agent for <strong>{{entityName}}</strong>.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Entity:</strong> {{entityName}}</p>
          <p><strong>State:</strong> {{state}}</p>
          <p><strong>Entity Type:</strong> {{entityType}}</p>
          <p><strong>Invited by:</strong> {{ownerName}}</p>
        </div>
        <p>{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{acceptUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            Accept Invitation
          </a>
          <a href="{{declineUrl}}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Decline
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          This invitation will expire on {{expirationDate}}. If you have any questions, please contact {{ownerEmail}}.
        </p>
        <p>Best regards,<br>EntityRenewal Pro Team</p>
      </div>
    `
  },
  payment_reminder: {
    subject: "Payment Due - {{entityName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Payment Reminder</h2>
        <p>Hello {{ownerName}},</p>
        <p>You have a payment due for <strong>{{entityName}}</strong>.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Amount Due:</strong> ${{amount}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Service:</strong> {{serviceName}}</p>
        </div>
        <a href="{{paymentUrl}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Pay Now
        </a>
        <p>Please make your payment by the due date to avoid late fees.</p>
        <p>Best regards,<br>EntityRenewal Pro Team</p>
      </div>
    `
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user for API usage logging
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    const { type, template, recipients, data, scheduledFor }: NotificationRequest = await req.json();

    if (!type || !template || !recipients || recipients.length === 0) {
      throw new Error("Missing required fields: type, template, recipients");
    }

    const results = [];

    if (type === 'email') {
      const emailTemplate = emailTemplates[template as keyof typeof emailTemplates];
      if (!emailTemplate) {
        throw new Error(`Email template '${template}' not found`);
      }

      // Replace template variables
      let subject = emailTemplate.subject;
      let html = emailTemplate.html;

      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
          html = html.replace(new RegExp(placeholder, 'g'), String(value));
        });
      }

      // Send emails
      for (const recipient of recipients) {
        try {
          if (scheduledFor && new Date(scheduledFor) > new Date()) {
            // Schedule for later
            const { error: scheduleError } = await supabaseClient
              .from('scheduled_notifications')
              .insert({
                user_id: userId,
                notification_type: template,
                title: subject,
                message: html,
                scheduled_for: scheduledFor,
                metadata: { 
                  recipient, 
                  template, 
                  type: 'email',
                  ...data 
                }
              });

            if (scheduleError) {
              throw new Error(`Failed to schedule notification: ${scheduleError.message}`);
            }

            results.push({ recipient, status: 'scheduled', scheduledFor });
          } else {
            // Send immediately
            const emailResponse = await resend.emails.send({
              from: "EntityRenewal Pro <noreply@entityrenewal.pro>",
              to: [recipient],
              subject: subject,
              html: html,
            });

            if (emailResponse.error) {
              throw new Error(emailResponse.error.message);
            }

            // Log notification
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: userId,
                type: template,
                title: subject,
                message: html,
                notification_type: 'email',
                email_sent: true,
                sent_at: new Date().toISOString(),
                timestamp: new Date().toISOString(),
                metadata: { recipient, emailId: emailResponse.data?.id }
              });

            results.push({ 
              recipient, 
              status: 'sent', 
              emailId: emailResponse.data?.id 
            });
          }
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          results.push({ 
            recipient, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    } else if (type === 'sms') {
      // SMS integration would go here
      // For now, return not implemented
      throw new Error("SMS notifications not yet implemented");
    } else if (type === 'push') {
      // Push notification integration would go here
      throw new Error("Push notifications not yet implemented");
    } else {
      throw new Error(`Unsupported notification type: ${type}`);
    }

    // Log API usage
    if (userId) {
      await supabaseClient
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          endpoint: '/notification-service',
          method: 'POST',
          status_code: 200,
          metadata: { type, template, recipientCount: recipients.length }
        });
    }

    return new Response(JSON.stringify({ 
      success: true,
      results,
      summary: {
        total: recipients.length,
        sent: results.filter(r => r.status === 'sent').length,
        scheduled: results.filter(r => r.status === 'scheduled').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Notification service error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Notification service failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});