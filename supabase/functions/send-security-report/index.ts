import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  reportType?: 'daily' | 'weekly';
  manualTrigger?: boolean;
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

    const { reportType = 'daily', manualTrigger = false }: ReportRequest = 
      req.method === 'POST' ? await req.json() : {};

    console.log(`Generating ${reportType} security report...`);

    // Get admin users
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admin users found');
      return new Response(
        JSON.stringify({ message: 'No admin users to send report to' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin emails from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const adminUserIds = new Set(adminRoles.map(r => r.user_id));
    const adminEmails = users
      .filter(user => adminUserIds.has(user.id))
      .map(user => user.email)
      .filter(email => email) as string[];

    if (adminEmails.length === 0) {
      console.log('No admin emails found');
      return new Response(
        JSON.stringify({ message: 'No admin emails found' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine date range based on report type
    const now = new Date();
    const startDate = new Date();
    if (reportType === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 1);
    }

    // Fetch IP reputation data
    const { data: ipReputations, error: ipError } = await supabase
      .from('ip_reputation')
      .select('*')
      .gte('updated_at', startDate.toISOString())
      .order('reputation_score', { ascending: true });

    if (ipError) {
      console.error('Error fetching IP reputation:', ipError);
      throw ipError;
    }

    // Fetch security violations
    const { data: violations, error: violationsError } = await supabase
      .from('analytics_data')
      .select('*')
      .in('metric_type', ['security_violation', 'security_monitoring'])
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (violationsError) {
      console.error('Error fetching violations:', violationsError);
      throw violationsError;
    }

    // Generate CSV for IP reputation
    const ipCsv = generateIpReputationCsv(ipReputations || []);
    
    // Generate CSV for violations
    const violationsCsv = generateViolationsCsv(violations || []);

    // Generate summary stats
    const stats = {
      totalIPs: ipReputations?.length || 0,
      criticalIPs: ipReputations?.filter(ip => ip.risk_level === 'critical').length || 0,
      highRiskIPs: ipReputations?.filter(ip => ip.risk_level === 'high').length || 0,
      blockedIPs: ipReputations?.filter(ip => ip.blocked_until && new Date(ip.blocked_until) > now).length || 0,
      totalViolations: violations?.length || 0,
      violationTypes: Array.from(new Set(violations?.map(v => v.metric_name) || [])),
    };

    // Send email to all admins
    const emailPromises = adminEmails.map(email => 
      resend.emails.send({
        from: "Security Reports <onboarding@resend.dev>",
        to: [email],
        subject: `${reportType === 'daily' ? 'Daily' : 'Weekly'} Security Report - ${now.toLocaleDateString()}`,
        html: generateEmailHtml(reportType, stats, startDate, now),
        attachments: [
          {
            filename: `ip_reputation_${reportType}_${now.toISOString().split('T')[0]}.csv`,
            content: Buffer.from(ipCsv).toString('base64'),
          },
          {
            filename: `security_violations_${reportType}_${now.toISOString().split('T')[0]}.csv`,
            content: Buffer.from(violationsCsv).toString('base64'),
          },
        ],
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Report sent successfully to ${successful} admins, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${reportType} security report sent to ${successful} admin(s)`,
        stats 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error generating security report:", error);
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

function generateIpReputationCsv(data: any[]): string {
  if (data.length === 0) return 'No data available';

  const headers = [
    'IP Address',
    'Reputation Score',
    'Risk Level',
    'Total Requests',
    'Failed Auth Attempts',
    'Rate Limit Violations',
    'Suspicious Patterns',
    'Last Violation',
    'Blocked Until',
    'First Seen',
    'Last Seen',
  ];

  const rows = data.map(ip => [
    ip.ip_address,
    ip.reputation_score,
    ip.risk_level,
    ip.total_requests,
    ip.failed_auth_attempts,
    ip.rate_limit_violations,
    ip.suspicious_patterns,
    ip.last_violation_at || 'N/A',
    ip.blocked_until || 'Not blocked',
    ip.first_seen_at,
    ip.last_seen_at,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateViolationsCsv(data: any[]): string {
  if (data.length === 0) return 'No data available';

  const headers = [
    'Timestamp',
    'User ID',
    'Metric Name',
    'Metric Type',
    'Value',
    'Metadata',
  ];

  const rows = data.map(v => [
    v.created_at,
    v.user_id || 'N/A',
    v.metric_name,
    v.metric_type,
    v.metric_value,
    JSON.stringify(v.metadata || {}).replace(/,/g, ';'),
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateEmailHtml(
  reportType: string,
  stats: any,
  startDate: Date,
  endDate: Date
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
          .stat-value { font-size: 32px; font-weight: bold; color: #1f2937; }
          .critical { color: #dc2626; }
          .high { color: #ea580c; }
          .warning { color: #d97706; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          .violation-type { display: inline-block; background: #e5e7eb; padding: 4px 12px; margin: 4px; border-radius: 12px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ ${reportType === 'daily' ? 'Daily' : 'Weekly'} Security Report</h1>
            <p>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
          </div>
          
          <div class="content">
            <h2>Executive Summary</h2>
            
            <div class="stat-card">
              <div class="stat-label">Total IP Addresses Tracked</div>
              <div class="stat-value">${stats.totalIPs}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Critical Risk IPs</div>
              <div class="stat-value critical">${stats.criticalIPs}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">High Risk IPs</div>
              <div class="stat-value high">${stats.highRiskIPs}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Currently Blocked IPs</div>
              <div class="stat-value warning">${stats.blockedIPs}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Total Security Violations</div>
              <div class="stat-value">${stats.totalViolations}</div>
            </div>

            ${stats.violationTypes.length > 0 ? `
              <div class="stat-card">
                <div class="stat-label">Violation Types Detected</div>
                <div style="margin-top: 10px;">
                  ${stats.violationTypes.map((type: string) => 
                    `<span class="violation-type">${type}</span>`
                  ).join('')}
                </div>
              </div>
            ` : ''}

            <p style="margin-top: 30px;">
              <strong>📎 Attachments:</strong><br>
              • IP Reputation Data (CSV)<br>
              • Security Violations Log (CSV)
            </p>

            <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <strong>⚠️ Action Required:</strong> Please review the attached reports and take necessary action on high-risk and critical IPs.
            </p>
          </div>

          <div class="footer">
            <p>This is an automated security report from Entity Renewal Pro</p>
            <p>Report generated on ${endDate.toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
