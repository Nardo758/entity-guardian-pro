import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface IPReputationEntry {
  id: string;
  ip_address: string;
  reputation_score: number;
  risk_level: string;
  failed_auth_attempts: number;
  rate_limit_violations: number;
  blocked_until: string | null;
  last_seen_at: string;
}

const IPReputation: React.FC = () => {
  const [entries, setEntries] = useState<IPReputationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ip_reputation')
        .select('*')
        .order('reputation_score', { ascending: true })
        .limit(50);

      if (!error && data) {
        setEntries(data as IPReputationEntry[]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="bg-destructive/20 text-destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning">Medium</Badge>;
      default:
        return <Badge className="bg-success/20 text-success">Low</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">IP Reputation</h1>
        <p className="text-muted-foreground">Monitor and manage IP address reputation scores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Risk IPs</p>
                <p className="text-2xl font-bold text-foreground">
                  {entries.filter(e => e.risk_level === 'low').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Medium/High Risk</p>
                <p className="text-2xl font-bold text-foreground">
                  {entries.filter(e => ['medium', 'high'].includes(e.risk_level)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <Globe className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blocked IPs</p>
                <p className="text-2xl font-bold text-foreground">
                  {entries.filter(e => e.blocked_until && new Date(e.blocked_until) > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            IP Addresses
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            All tracked IP addresses and their reputation scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No IP reputation data found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Risk Level</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Failed Auth</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rate Violations</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-3 px-4 text-foreground font-mono text-sm">{entry.ip_address}</td>
                      <td className={`py-3 px-4 font-bold ${getScoreColor(entry.reputation_score)}`}>
                        {entry.reputation_score}
                      </td>
                      <td className="py-3 px-4">{getRiskBadge(entry.risk_level)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{entry.failed_auth_attempts || 0}</td>
                      <td className="py-3 px-4 text-muted-foreground">{entry.rate_limit_violations || 0}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {format(new Date(entry.last_seen_at), 'PP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IPReputation;
