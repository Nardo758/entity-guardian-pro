import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Key, Plus, Copy, RotateCcw, Trash2, Activity, 
  TrendingUp, AlertTriangle, CheckCircle, Globe, 
  Clock, Shield, Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAPIManagement } from '@/hooks/useAPIManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const APIManagementPanel = () => {
  const { 
    apiKeys, 
    endpoints, 
    usageStats, 
    loading, 
    error,
    createAPIKey,
    revokeAPIKey,
    updateEndpoint,
    regenerateAPIKey 
  } = useAPIManagement();

  const [isCreateKeyDialogOpen, setIsCreateKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState('1000');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !usageStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load API management data</p>
        </CardContent>
      </Card>
    );
  }

  const availablePermissions = [
    'read:entities',
    'write:entities',
    'read:users',
    'write:users',
    'read:analytics',
    'read:reports',
    'write:documents',
    'admin:all'
  ];

  const handleCreateAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter an API key name');
      return;
    }

    try {
      await createAPIKey(
        newKeyName,
        newKeyPermissions,
        parseInt(newKeyRateLimit),
        newKeyExpiry || undefined
      );
      toast.success('API key created successfully');
      setIsCreateKeyDialogOpen(false);
      setNewKeyName('');
      setNewKeyPermissions([]);
      setNewKeyRateLimit('1000');
      setNewKeyExpiry('');
    } catch (err) {
      toast.error('Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeAPIKey(keyId);
      toast.success('API key revoked successfully');
    } catch (err) {
      toast.error('Failed to revoke API key');
    }
  };

  const handleRegenerateKey = async (keyId: string) => {
    try {
      await regenerateAPIKey(keyId);
      toast.success('API key regenerated successfully');
    } catch (err) {
      toast.error('Failed to regenerate API key');
    }
  };

  const handleToggleEndpoint = async (endpointId: string, isActive: boolean) => {
    try {
      await updateEndpoint(endpointId, { is_active: isActive });
      toast.success(`Endpoint ${isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      toast.error('Failed to update endpoint');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">API Management</h2>
        <Dialog open={isCreateKeyDialogOpen} onOpenChange={setIsCreateKeyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Enter API key name"
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {availablePermissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={newKeyPermissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewKeyPermissions(prev => [...prev, permission]);
                          } else {
                            setNewKeyPermissions(prev => prev.filter(p => p !== permission));
                          }
                        }}
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rateLimit">Rate Limit (per hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry Date (optional)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateKeyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAPIKey}>
                  <Key className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{usageStats.total_requests_24h.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Requests (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-blue-600">
                {usageStats.unique_clients}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{usageStats.avg_response_time}ms</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-green-600">
                {(100 - usageStats.error_rate).toFixed(1)}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{usageStats.error_rate}%</p>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium">
                {apiKeys.filter(key => key.is_active).length}/{apiKeys.length}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{apiKeys.length}</p>
              <p className="text-sm text-muted-foreground">API Keys</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Usage (24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageStats.usage_by_hour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageStats.top_endpoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="path" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Key className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{key.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="font-mono text-xs">{key.key_prefix}</span>
                      <span>{key.usage_count.toLocaleString()} requests</span>
                      {key.last_used && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(key.last_used).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={key.is_active ? 'default' : 'secondary'}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {key.rate_limit}/hr
                  </span>
                  {key.is_active && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRegenerateKey(key.id)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(key.key_prefix.replace('...', 'full_key_here'));
                          toast.success('API key copied to clipboard');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="font-mono">
                    {endpoint.method}
                  </Badge>
                  <div>
                    <h4 className="font-medium text-foreground font-mono">{endpoint.path}</h4>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {endpoint.usage_24h} requests
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {endpoint.avg_response_time}ms
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {endpoint.error_rate}% errors
                      </span>
                      {endpoint.auth_required && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Auth Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    {endpoint.rate_limit}/min
                  </span>
                  <Switch
                    checked={endpoint.is_active}
                    onCheckedChange={(checked) => handleToggleEndpoint(endpoint.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIManagementPanel;