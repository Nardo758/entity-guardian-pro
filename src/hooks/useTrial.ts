import { useState, useEffect } from 'react';
import { useSubscription } from './useSubscription';

export interface TrialInfo {
  isTrialActive: boolean;
  trialStart: string | null;
  trialEnd: string | null;
  daysRemaining: number;
  hasExpired: boolean;
}

export const useTrial = () => {
  const { subscription, loading } = useSubscription();
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isTrialActive: false,
    trialStart: null,
    trialEnd: null,
    daysRemaining: 0,
    hasExpired: false,
  });

  useEffect(() => {
    if (!subscription.trial_start) {
      setTrialInfo({
        isTrialActive: false,
        trialStart: null,
        trialEnd: null,
        daysRemaining: 0,
        hasExpired: false,
      });
      return;
    }

    const trialStart = new Date(subscription.trial_start);
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const now = new Date();
    const timeRemaining = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)));
    const hasExpired = timeRemaining <= 0;
    const isTrialActive = subscription.is_trial_active === true && !hasExpired;

    setTrialInfo({
      isTrialActive,
      trialStart: subscription.trial_start,
      trialEnd: trialEnd.toISOString(),
      daysRemaining,
      hasExpired,
    });
  }, [subscription]);

  return {
    ...trialInfo,
    loading,
  };
};
