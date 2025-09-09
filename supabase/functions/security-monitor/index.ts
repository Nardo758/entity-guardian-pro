import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlert {
  type: 'admin_bulk_access' | 'repeated_failures' | 'suspicious_activity' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  metadata: Record<string, any>;
}

interface MonitoringRequest {
  action: 'check_patterns' | 'alert' | 'get_security_status';
  timeWindow?: number; // minutes
  alertData?: SecurityAlert;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Authentication failed");
    }

    const { action, timeWindow = 60, alertData }: MonitoringRequest = await req.json();

    switch (action) {
      case 'check_patterns':
        return await checkSecurityPatterns(supabase, timeWindow);
        
      case 'alert':
        if (!alertData) {
          throw new Error("Alert data required");
        }
        return await processSecurityAlert(supabase, user.id, alertData);
        
      case 'get_security_status':
        return await getSecurityStatus(supabase, user.id);
        
      default:
        throw new Error("Invalid action");
    }

  } catch (error) {
    console.error("Security monitor error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Security monitoring failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function checkSecurityPatterns(supabase: any, timeWindowMinutes: number) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  // Check for suspicious patterns in the last time window
  const { data: events, error } = await supabase
    .from('analytics_data')
    .select('*')
    .eq('metric_type', 'security_event')
    .gte('created_at', timeWindow.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch security events: ${error.message}`);
  }

  const patterns = {
    repeatedFailures: events.filter((e: any) => e.metric_name === 'failed_auth').length,
    adminAccess: events.filter((e: any) => e.metric_name === 'admin_action').length,
    unauthorizedAccess: events.filter((e: any) => e.metric_name === 'unauthorized_access').length,
    suspiciousActivity: events.filter((e: any) => e.metric_name === 'suspicious_activity').length,
    totalEvents: events.length
  };

  // Determine alert level
  let alertLevel = 'normal';
  if (patterns.repeatedFailures > 10 || patterns.unauthorizedAccess > 5) {
    alertLevel = 'high';
  } else if (patterns.adminAccess > 20 || patterns.suspiciousActivity > 3) {
    alertLevel = 'medium';
  }

  return new Response(JSON.stringify({
    success: true,
    timeWindow: timeWindowMinutes,
    patterns,
    alertLevel,
    recommendations: generateRecommendations(patterns)
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function processSecurityAlert(supabase: any, userId: string, alert: SecurityAlert) {
  // Log the security alert
  const { error: logError } = await supabase
    .from('analytics_data')
    .insert({
      user_id: alert.userId || userId,
      metric_type: 'security_alert',
      metric_name: alert.type,
      metric_value: getSeverityScore(alert.severity),
      metric_date: new Date().toISOString().split('T')[0],
      metadata: {
        severity: alert.severity,
        alert_metadata: alert.metadata,
        processed_at: new Date().toISOString(),
        processed_by: userId
      }
    });

  if (logError) {
    console.error('Failed to log security alert:', logError);
  }

  // For critical alerts, take immediate action
  if (alert.severity === 'critical') {
    await handleCriticalAlert(supabase, alert);
  }

  return new Response(JSON.stringify({
    success: true,
    alert: {
      id: crypto.randomUUID(),
      type: alert.type,
      severity: alert.severity,
      processed: true,
      timestamp: new Date().toISOString()
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getSecurityStatus(supabase: any, userId: string) {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get recent security events for this user
  const { data: userEvents, error: userError } = await supabase
    .from('analytics_data')
    .select('*')
    .eq('user_id', userId)
    .eq('metric_type', 'security_event')
    .gte('created_at', last24Hours.toISOString())
    .order('created_at', { ascending: false });

  if (userError) {
    throw new Error(`Failed to fetch user security events: ${userError.message}`);
  }

  // Get system-wide security status
  const { data: systemEvents, error: systemError } = await supabase
    .from('analytics_data')
    .select('metric_name, metric_value')
    .eq('metric_type', 'security_event')
    .gte('created_at', last24Hours.toISOString());

  if (systemError) {
    throw new Error(`Failed to fetch system security events: ${systemError.message}`);
  }

  const userSecurityScore = calculateSecurityScore(userEvents);
  const systemThreatLevel = calculateThreatLevel(systemEvents);

  return new Response(JSON.stringify({
    success: true,
    userStatus: {
      securityScore: userSecurityScore,
      recentEvents: userEvents.length,
      riskLevel: userSecurityScore > 70 ? 'low' : userSecurityScore > 40 ? 'medium' : 'high'
    },
    systemStatus: {
      threatLevel: systemThreatLevel,
      totalEvents: systemEvents.length
    },
    recommendations: generateUserRecommendations(userEvents)
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

function getSeverityScore(severity: string): number {
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  return scores[severity as keyof typeof scores] || 1;
}

function calculateSecurityScore(events: any[]): number {
  if (events.length === 0) return 100;
  
  const severityPoints = events.reduce((total, event) => {
    const severity = event.metadata?.severity || 'low';
    return total + getSeverityScore(severity);
  }, 0);
  
  return Math.max(0, 100 - (severityPoints * 5));
}

function calculateThreatLevel(events: any[]): string {
  const threatCount = events.filter(e => 
    ['unauthorized_access', 'suspicious_activity', 'failed_auth'].includes(e.metric_name)
  ).length;
  
  if (threatCount > 20) return 'high';
  if (threatCount > 10) return 'medium';
  return 'low';
}

function generateRecommendations(patterns: any): string[] {
  const recommendations = [];
  
  if (patterns.repeatedFailures > 5) {
    recommendations.push("Consider implementing stronger password policies");
    recommendations.push("Enable two-factor authentication for all users");
  }
  
  if (patterns.unauthorizedAccess > 2) {
    recommendations.push("Review and tighten access control policies");
    recommendations.push("Audit user permissions and roles");
  }
  
  if (patterns.adminAccess > 15) {
    recommendations.push("Implement additional approval workflows for admin actions");
    recommendations.push("Consider time-based session restrictions for admin users");
  }
  
  return recommendations;
}

function generateUserRecommendations(events: any[]): string[] {
  const recommendations = [];
  
  const failedAuths = events.filter(e => e.metric_name === 'failed_auth').length;
  const suspiciousActivity = events.filter(e => e.metric_name === 'suspicious_activity').length;
  
  if (failedAuths > 0) {
    recommendations.push("Enable two-factor authentication on your account");
    recommendations.push("Use a strong, unique password");
  }
  
  if (suspiciousActivity > 0) {
    recommendations.push("Review your recent account activity");
    recommendations.push("Log out of all devices and log back in");
  }
  
  return recommendations;
}

async function handleCriticalAlert(supabase: any, alert: SecurityAlert) {
  // For critical alerts, we might want to:
  // 1. Temporarily lock the account
  // 2. Send immediate notifications
  // 3. Trigger additional security measures
  
  console.log(`CRITICAL SECURITY ALERT: ${alert.type}`, alert.metadata);
  
  // Log as high-priority security violation
  await supabase.rpc('log_security_violation', {
    violation_type: `critical_${alert.type}`,
    user_id_param: alert.userId || null,
    details: {
      severity: 'critical',
      alert_metadata: alert.metadata,
      auto_triggered: true,
      immediate_action_required: true
    }
  });
}