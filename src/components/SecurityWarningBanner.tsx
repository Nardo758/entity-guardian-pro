import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const SecurityWarningBanner = () => {
  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Security Configuration Needed
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Your Supabase project has some security settings that should be configured for production use.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">1. Auth OTP Settings:</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  OTP expiry time should be reduced for better security.
                </p>
              </div>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">2. Password Protection:</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Enable leaked password protection to prevent compromised passwords.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <a 
                  href="https://supabase.com/docs/guides/platform/going-into-prod#security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Security Guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <a 
                  href="https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Password Security
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};