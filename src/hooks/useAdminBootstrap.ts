import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BootstrapResult {
  success: boolean;
  message: string;
  admin_user_id?: string;
  admin_email?: string;
  locked?: boolean;
}

export const useAdminBootstrap = () => {
  const { toast } = useToast();
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const bootstrapCurrentUser = async (): Promise<BootstrapResult> => {
    setIsBootstrapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin', {
        body: {},
      });

      if (error) {
        console.error('Bootstrap error:', error);
        toast({
          title: 'Bootstrap Failed',
          description: error.message || 'Failed to bootstrap admin user',
          variant: 'destructive',
        });
        return { success: false, message: error.message };
      }

      if (data.error) {
        toast({
          title: 'Bootstrap Failed',
          description: data.message || 'Failed to bootstrap admin user',
          variant: 'destructive',
        });
        return { success: false, message: data.message, locked: data.locked };
      }

      toast({
        title: 'Admin Bootstrap Successful',
        description: data.message || 'You are now an admin user',
      });

      return {
        success: true,
        message: data.message,
        admin_user_id: data.admin_user_id,
        admin_email: data.admin_email,
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, message };
    } finally {
      setIsBootstrapping(false);
    }
  };

  const bootstrapSpecificEmail = async (targetEmail: string): Promise<BootstrapResult> => {
    setIsBootstrapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('bootstrap-admin', {
        body: { targetEmail },
      });

      if (error) {
        console.error('Bootstrap error:', error);
        toast({
          title: 'Bootstrap Failed',
          description: error.message || 'Failed to bootstrap admin user',
          variant: 'destructive',
        });
        return { success: false, message: error.message };
      }

      if (data.error) {
        toast({
          title: 'Bootstrap Failed',
          description: data.message || 'Failed to bootstrap admin user',
          variant: 'destructive',
        });
        return { success: false, message: data.message, locked: data.locked };
      }

      toast({
        title: 'Admin Bootstrap Successful',
        description: `Admin user created: ${data.admin_email}`,
      });

      return {
        success: true,
        message: data.message,
        admin_user_id: data.admin_user_id,
        admin_email: data.admin_email,
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, message };
    } finally {
      setIsBootstrapping(false);
    }
  };

  return {
    bootstrapCurrentUser,
    bootstrapSpecificEmail,
    isBootstrapping,
  };
};
