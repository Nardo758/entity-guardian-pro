import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from './useAdminAccess';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useAdminMFA = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  // Check if MFA is enabled for the current user
  const { data: mfaStatus, isLoading, refetch } = useQuery({
    queryKey: ['admin-mfa-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking MFA status:', error);
        return null;
      }

      const totpFactor = data?.totp?.find((f) => f.status === 'verified');
      
      return {
        isMFAEnabled: !!totpFactor,
        factors: data?.totp || [],
        verifiedFactor: totpFactor
      };
    },
    enabled: !!user,
  });

  const requiresMFA = isAdmin && !mfaStatus?.isMFAEnabled;
  const hasMFAEnabled = mfaStatus?.isMFAEnabled ?? false;

  return {
    isMFAEnabled: hasMFAEnabled,
    requiresMFA,
    isLoading,
    factors: mfaStatus?.factors || [],
    verifiedFactor: mfaStatus?.verifiedFactor,
    refetchMFAStatus: refetch,
  };
};
