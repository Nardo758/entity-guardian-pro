import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  actionType: string;
  actionCategory: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  targetUserEmail?: string;
  ipAddress?: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      actionType,
      actionCategory,
      severity,
      description,
      targetUserEmail,
      ipAddress,
      metadata = {}
    }: SecurityAlertRequest = await req.json();

    console.log(`Processing security alert: ${actionType} (${severity})`);

    // Only send emails for critical and warning events
    if (severity !== 'critical' && severity !== 'warning') {
      console.log('Event severity not high enough for email notification');
      return new Response(
        JSON.stringify({ success: true, message: 'Event logged, no email sent' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all admin users
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError || !adminRoles || adminRoles.length === 0) {
      console.error('Error fetching admin users or no admins found:', adminError);
      return new Response(
        JSON.stringify({ success: false, message: 'No admin users found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin emails
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const adminUserIds = new Set(adminRoles.map(r => r.user_id));
    const adminEmails = users
      .filter((user: any) => adminUserIds.has(user.id))
      .map((user: any) => user.email)
      .filter((email: string) => email);

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(
        JSON.stringify({ success: false, message: 'No admin emails found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email content based on alert type
    const emailSubject = `🚨 ${severity === 'critical' ? 'CRITICAL' : 'WARNING'} Security Alert - ${actionType}`;
    const emailHtml = generateAlertEmailHtml(
      actionType,
      actionCategory,
      severity,
      description,
      targetUserEmail,
      ipAddress,
      metadata
    );

    // Send email to all admins
    const emailPromises = adminEmails.map(email => 
      resend.emails.send({
        from: "Security Alerts <security@resend.dev>",
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Alert sent to ${successful} admins, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Security alert sent to ${successful} admin(s)`,
        severity,
        actionType
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error sending security alert:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function generateAlertEmailHtml(
  actionType: string,
  actionCategory: string,
  severity: string,
  description: string,
  targetUserEmail?: string,
  ipAddress?: string,
  metadata?: any
): string {
  const now = new Date();
  const severityColor = severity === 'critical' ? '#dc2626' : '#ea580c';
  const severityBg = severity === 'critical' ? '#fee2e2' : '#fed7aa';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: ${severityColor}; 
            color: white; 
            padding: 30px; 
            border-radius: 10px 10px 0 0; 
          }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-badge { 
            display: inline-block;
            background: ${severityBg}; 
            color: ${severityColor}; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 20px;
          }
          .detail-card { 
            background: white; 
            padding: 20px; 
            margin: 15px 0; 
            border-radius: 8px; 
            border-left: 4px solid ${severityColor};
          }
          .detail-label { 
            font-size: 12px; 
            color: #6b7280; 
            text-transform: uppercase;
            margin-bottom: 5px; 
          }
          .detail-value { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1f2937; 
          }
          .metadata { 
            background: #f3f4f6; 
            padding: 15px; 
            border-radius: 6px; 
            font-family: monospace; 
            font-size: 13px;
            overflow-x: auto;
          }
          .action-button {
            display: inline-block;
            background: ${severityColor};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #6b7280; 
            font-size: 12px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Security Alert</h1>
            <p style="margin: 0; opacity: 0.9;">${now.toLocaleString()}</p>
          </div>
          
          <div class="content">
            <div class="alert-badge">${severity} SEVERITY</div>
            
            <div class="detail-card">
              <div class="detail-label">Action Type</div>
              <div class="detail-value">${actionType}</div>
            </div>

            <div class="detail-card">
              <div class="detail-label">Category</div>
              <div class="detail-value">${actionCategory}</div>
            </div>

            <div class="detail-card">
              <div class="detail-label">Description</div>
              <div class="detail-value">${description}</div>
            </div>

            ${targetUserEmail ? `
              <div class="detail-card">
                <div class="detail-label">Target User</div>
                <div class="detail-value">${targetUserEmail}</div>
              </div>
            ` : ''}

            ${ipAddress ? `
              <div class="detail-card">
                <div class="detail-label">IP Address</div>
                <div class="detail-value">${ipAddress}</div>
              </div>
            ` : ''}

            ${metadata && Object.keys(metadata).length > 0 ? `
              <div class="detail-card">
                <div class="detail-label">Additional Details</div>
                <div class="metadata">${JSON.stringify(metadata, null, 2)}</div>
              </div>
            ` : ''}

            <a href="https://wcuxqopfcgivypbiynjp.supabase.co" class="action-button">
              View Admin Dashboard
            </a>

            <p style="margin-top: 30px; padding: 15px; background: ${severityBg}; border-left: 4px solid ${severityColor}; border-radius: 4px;">
              <strong>⚠️ Immediate Action Required:</strong> This ${severity} security event requires your immediate attention. Please review and take appropriate action.
            </p>
          </div>

          <div class="footer">
            <p>This is an automated security alert from Entity Renewal Pro</p>
            <p>You are receiving this because you are an administrator</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
