import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lock, Crown } from 'lucide-react';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { useUpgradePrompt } from '@/components/UpgradePrompt';

interface SMSVerificationGateProps {
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  onSendCode: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SMSVerificationGate: React.FC<SMSVerificationGateProps> = ({
  phoneNumber,
  onPhoneChange,
  onSendCode,
  isLoading = false,
  disabled = false
}) => {
  const permissions = useTierPermissions();
  const { showUpgradePrompt, UpgradePromptComponent } = useUpgradePrompt();

  const handleRestrictedAction = () => {
    showUpgradePrompt(
      'SMS Verification',
      'growth',
      'Enable SMS verification and notifications with the Growth plan.'
    );
  };

  if (!permissions.canUseSMS) {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-dashed border-muted-foreground/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Verification
              </CardTitle>
              <Badge variant="outline" className="gap-1">
                <Crown className="h-3 w-3" />
                Growth Required
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                SMS verification and notifications are available with the Growth plan.
              </p>
            </div>
            <Button onClick={handleRestrictedAction} className="gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to Growth Plan
            </Button>
          </CardContent>
        </Card>
        <UpgradePromptComponent />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={disabled || isLoading}
          />
        </div>
        <Button 
          onClick={onSendCode}
          disabled={!phoneNumber || isLoading || disabled}
          className="w-full gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Button>
      </CardContent>
    </Card>
  );
};