import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, RefreshCw, AlertTriangle, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Generate cryptographically secure recovery codes
const generateRecoveryCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomValues = new Uint8Array(6);
    crypto.getRandomValues(randomValues);
    const code = Array.from(randomValues)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-') || '';
    codes.push(code);
  }
  return codes;
};

// Hash recovery code for secure storage
const hashRecoveryCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const MFARecoveryCodesManager: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCodes, setShowCodes] = useState(false);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  // Fetch recovery codes count
  const { data: codesData, isLoading } = useQuery({
    queryKey: ['recovery-codes-count', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_unused_recovery_code_count', { p_user_id: user.id });

      if (error) throw error;
      return { unusedCount: data || 0 };
    },
    enabled: !!user,
  });

  // Regenerate recovery codes mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      // Delete old recovery codes
      await supabase
        .from('mfa_recovery_codes')
        .delete()
        .eq('user_id', user.id);

      // Generate new codes
      const codes = generateRecoveryCodes(10);
      
      // Store hashed codes
      const hashedCodes = await Promise.all(
        codes.map(async (code) => ({
          user_id: user.id,
          code_hash: await hashRecoveryCode(code)
        }))
      );

      const { error } = await supabase
        .from('mfa_recovery_codes')
        .insert(hashedCodes);

      if (error) throw error;

      // Log regeneration
      await supabase.from('analytics_data').insert({
        user_id: user.id,
        metric_type: 'security_event',
        metric_name: 'mfa_recovery_codes_regenerated',
        metric_value: 1,
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          timestamp: new Date().toISOString(),
          codes_generated: codes.length
        }
      });

      // Also log to audit log
      await supabase.rpc('log_admin_action', {
        p_action_type: 'mfa_recovery_codes_regenerated',
        p_action_category: 'mfa',
        p_severity: 'warning',
        p_description: 'Administrator regenerated MFA recovery codes',
        p_metadata: {
          codes_count: codes.length,
          timestamp: new Date().toISOString()
        }
      });

      return codes;
    },
    onSuccess: (codes) => {
      setNewCodes(codes);
      queryClient.invalidateQueries({ queryKey: ['recovery-codes-count'] });
      toast({
        title: "Recovery Codes Regenerated",
        description: "New recovery codes have been generated. Save them securely!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate recovery codes",
        variant: "destructive"
      });
    },
  });

  const handleCopyAll = () => {
    if (newCodes) {
      navigator.clipboard.writeText(newCodes.join('\n'));
      toast({
        title: "Copied",
        description: "Recovery codes copied to clipboard",
      });
    }
  };

  const handleDownload = () => {
    if (newCodes) {
      const text = `MFA Recovery Codes - Generated ${new Date().toISOString()}\n\n${newCodes.join('\n')}\n\nIMPORTANT: Each code can only be used once. Store these codes securely.`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mfa-recovery-codes-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded",
        description: "Recovery codes saved to file",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          MFA Recovery Codes
        </CardTitle>
        <CardDescription>
          Backup codes for accessing your account if you lose your authenticator device
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!newCodes ? (
          <>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Available Recovery Codes</p>
                <p className="text-sm text-muted-foreground">
                  {codesData?.unusedCount || 0} unused codes remaining
                </p>
              </div>
              <Badge variant={codesData?.unusedCount && codesData.unusedCount > 5 ? "default" : "destructive"}>
                {codesData?.unusedCount || 0}/10
              </Badge>
            </div>

            {codesData?.unusedCount !== undefined && codesData.unusedCount < 3 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> You're running low on recovery codes. 
                  Regenerate new codes to ensure you can recover your account if needed.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Regenerating codes will invalidate all existing codes. Make sure to save
                the new codes securely after regenerating.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="w-full"
            >
              {regenerateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Recovery Codes
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>IMPORTANT:</strong> Save these codes now! They won't be shown again.
                Each code can only be used once.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Your New Recovery Codes</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodes(!showCodes)}
                >
                  {showCodes ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg border-2 border-border">
                {newCodes.map((code, index) => (
                  <div 
                    key={index} 
                    className="font-mono text-sm p-2 bg-background rounded border text-center"
                  >
                    {showCodes ? code : '••••-••••-••••'}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyAll}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setNewCodes(null)}
              variant="default"
              className="w-full"
            >
              I've Saved My Codes
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MFARecoveryCodesManager;
