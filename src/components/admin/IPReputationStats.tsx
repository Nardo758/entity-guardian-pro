import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Ban, Activity } from 'lucide-react';
import { IPReputationRecord } from '@/hooks/useIPReputation';

interface IPReputationStatsProps {
  ipReputations: IPReputationRecord[];
}

export const IPReputationStats: React.FC<IPReputationStatsProps> = ({ ipReputations }) => {
  const stats = React.useMemo(() => {
    if (!ipReputations) return null;

    const totalIPs = ipReputations.length;
    const blockedIPs = ipReputations.filter(ip => 
      ip.blocked_until && new Date(ip.blocked_until) > new Date()
    ).length;
    const criticalIPs = ipReputations.filter(ip => ip.risk_level === 'critical').length;
    const highRiskIPs = ipReputations.filter(ip => ip.risk_level === 'high').length;
    const totalViolations = ipReputations.reduce((sum, ip) => 
      sum + ip.failed_auth_attempts + ip.rate_limit_violations + ip.suspicious_patterns, 0
    );

    return {
      totalIPs,
      blockedIPs,
      criticalIPs,
      highRiskIPs,
      totalViolations,
    };
  }, [ipReputations]);

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total IPs Tracked</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalIPs}</div>
          <p className="text-xs text-muted-foreground">
            Active IP addresses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
          <Ban className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.blockedIPs}</div>
          <p className="text-xs text-muted-foreground">
            Currently blocked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Risk IPs</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">
            {stats.criticalIPs + stats.highRiskIPs}
          </div>
          <p className="text-xs text-muted-foreground">
            Critical: {stats.criticalIPs} | High: {stats.highRiskIPs}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalViolations}</div>
          <p className="text-xs text-muted-foreground">
            All security events
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
