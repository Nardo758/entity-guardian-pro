import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Ban } from 'lucide-react';
import { SecurityViolation } from '@/hooks/useSecurityViolations';
import { formatDistanceToNow } from 'date-fns';

interface SecurityViolationsLogProps {
  violations: SecurityViolation[];
}

const getViolationIcon = (metricName: string) => {
  if (metricName.includes('rate_limit')) return Ban;
  if (metricName.includes('failed') || metricName.includes('violation')) return AlertTriangle;
  return Shield;
};

const getViolationColor = (metricName: string) => {
  if (metricName.includes('critical') || metricName.includes('rate_limit')) return 'text-red-500';
  if (metricName.includes('failed')) return 'text-orange-500';
  return 'text-yellow-500';
};

export const SecurityViolationsLog: React.FC<SecurityViolationsLogProps> = ({ violations }) => {
  if (!violations || violations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No security violations recorded
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Violations</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {violations.map((violation) => {
              const Icon = getViolationIcon(violation.metric_name);
              const colorClass = getViolationColor(violation.metric_name);

              return (
                <div
                  key={violation.id}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{violation.metric_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {violation.metric_type}
                      </Badge>
                    </div>
                    {violation.metadata && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {violation.metadata.ip_address && (
                          <div>IP: <span className="font-mono">{violation.metadata.ip_address}</span></div>
                        )}
                        {violation.metadata.endpoint && (
                          <div>Endpoint: {violation.metadata.endpoint}</div>
                        )}
                        {violation.metadata.current_requests && (
                          <div>Requests: {violation.metadata.current_requests}/{violation.metadata.max_requests}</div>
                        )}
                        {violation.metadata.reputation_score !== undefined && (
                          <div>Reputation: {violation.metadata.reputation_score}/100</div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(violation.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
