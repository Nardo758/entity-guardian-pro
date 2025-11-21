import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { useTrial } from '@/hooks/useTrial';
import { useNavigate } from 'react-router-dom';

export const TrialPlanCard: React.FC = () => {
  const navigate = useNavigate();
  const { isTrialActive, daysRemaining } = useTrial();

  if (!isTrialActive) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">🎉 14-Day Free Trial</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Full access to all features
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            Unlimited entities during trial
          </div>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            Advanced notifications
          </div>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            Full feature access
          </div>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            Email support
          </div>
        </div>

        <Button 
          onClick={() => navigate('/billing')}
          className="w-full"
        >
          Start Free Trial
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          No credit card required • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
};
