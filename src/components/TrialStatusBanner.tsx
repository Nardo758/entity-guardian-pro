import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrial } from '@/hooks/useTrial';

export const TrialStatusBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isTrialActive, daysRemaining } = useTrial();

  if (!isTrialActive) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                {daysRemaining > 0 ? `Free trial: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` : 'Last day of free trial!'}
              </h4>
              <p className="text-sm text-muted-foreground">
                Upgrade now to continue enjoying all features
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Upgrade Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
