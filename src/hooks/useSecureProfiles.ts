import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SecureProfile {
  id: string;
  user_id: string;
  first_name_masked?: string;
  last_name_masked?: string;
  company?: string;
  company_size?: string;
  plan?: string;
  created_at?: string;
  updated_at?: string;
  user_type?: string;
  account_status?: string;
  suspension_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  phone_number_masked?: string;
}

// Client-side PII masking function
const maskPII = (value: string | null | undefined, showPartial = false): string => {
  if (!value) return 'N/A';
  
  if (showPartial && value.length > 1) {
    return value.charAt(0) + '*'.repeat(Math.max(value.length - 1, 0));
  }
  
  return '*'.repeat(value.length);
};

const maskPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  
  // Show last 4 digits only
  if (phone.length > 4) {
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }
  
  return '*'.repeat(phone.length);
};

export const useSecureProfiles = () => {
  return useQuery({
    queryKey: ['secure-profiles'],
    queryFn: async (): Promise<SecureProfile[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          company,
          company_size,
          plan,
          created_at,
          updated_at,
          user_type,
          account_status,
          suspension_reason,
          suspended_at,
          suspended_by,
          phone_number
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Apply client-side masking for admin security
      return profiles?.map(profile => {
        const secureProfile: SecureProfile = {
          id: profile.id,
          user_id: profile.user_id,
          first_name_masked: maskPII(profile.first_name, true),
          last_name_masked: maskPII(profile.last_name, true),
          phone_number_masked: maskPhoneNumber(profile.phone_number),
          company: profile.company,
          company_size: profile.company_size,
          plan: profile.plan,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          user_type: profile.user_type,
          account_status: profile.account_status || 'active',
          suspension_reason: profile.suspension_reason,
          suspended_at: profile.suspended_at,
          suspended_by: profile.suspended_by,
        };
        return secureProfile;
      }) || [];
    },
  });
};

export const useUserProfileSecure = (userId: string) => {
  return useQuery({
    queryKey: ['user-profile-secure', userId],
    queryFn: async (): Promise<SecureProfile | null> => {
      if (!userId) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!profile) return null;

      // Apply masking
      const secureProfile: SecureProfile = {
        id: profile.id,
        user_id: profile.user_id,
        first_name_masked: maskPII(profile.first_name, true),
        last_name_masked: maskPII(profile.last_name, true),
        phone_number_masked: maskPhoneNumber(profile.phone_number),
        company: profile.company,
        company_size: profile.company_size,
        plan: profile.plan,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        user_type: profile.user_type,
        account_status: profile.account_status || 'active',
        suspension_reason: profile.suspension_reason,
        suspended_at: profile.suspended_at,
        suspended_by: profile.suspended_by,
      };
      
      return secureProfile;
    },
    enabled: !!userId,
  });
};