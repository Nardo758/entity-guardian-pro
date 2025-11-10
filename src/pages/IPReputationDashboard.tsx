import React from 'react';
import { useIPReputation } from '@/hooks/useIPReputation';
import { useSecurityViolations } from '@/hooks/useSecurityViolations';
import { IPReputationStats } from '@/components/admin/IPReputationStats';
import { IPReputationTable } from '@/components/admin/IPReputationTable';
import { SecurityViolationsLog } from '@/components/admin/SecurityViolationsLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const IPReputationDashboard: React.FC = () => {
  const {
    ipReputations,
    isLoading: isLoadingIPs,
    error: ipError,
    blockIP,
    unblockIP,
    resetReputation,
    deleteIP,
  } = useIPReputation();

  const {
    violations,
    isLoading: isLoadingViolations,
    error: violationsError,
  } = useSecurityViolations(100);

  if (ipError || violationsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            {ipError?.message || violationsError?.message || 'Failed to load security data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleBlock = (ipAddress: string, hours: number) => {
    blockIP.mutate({ ipAddress, hours });
  };

  const handleUnblock = (ipAddress: string) => {
    unblockIP.mutate(ipAddress);
  };

  const handleReset = (ipAddress: string) => {
    resetReputation.mutate(ipAddress);
  };

  const handleDelete = (ipAddress: string) => {
    deleteIP.mutate(ipAddress);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            IP Reputation Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage IP reputation scores and security violations
          </p>
        </div>
      </div>

      {/* Stats */}
      {ipReputations && <IPReputationStats ipReputations={ipReputations} />}

      {/* Main Content */}
      <Tabs defaultValue="ips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ips" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            IP Addresses
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Violations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP Reputation Management</CardTitle>
              <CardDescription>
                View and manage IP addresses, their reputation scores, and security status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingIPs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : ipReputations && ipReputations.length > 0 ? (
                <IPReputationTable
                  ipReputations={ipReputations}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                  onReset={handleReset}
                  onDelete={handleDelete}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No IP addresses tracked yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          {isLoadingViolations ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <SecurityViolationsLog violations={violations || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IPReputationDashboard;
