import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Shield, Lock, CheckCircle2, X } from 'lucide-react';

const STORAGE_KEY = 'security-warning-dismissed';

export const SecurityWarningBanner = () => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card className="border-warning/30 bg-gradient-to-r from-warning/8 via-warning/5 to-transparent shadow-lg hover:shadow-xl transition-all duration-200 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-warning/15 rounded-2xl flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-bold text-lg text-warning mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration Required
              </h3>
              <p className="text-muted-foreground font-medium">
                Your Supabase project needs security configuration for production use. Please review and configure these settings.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card/60 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-warning" />
                  <p className="font-semibold text-foreground">Auth OTP Settings</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reduce OTP expiry time for enhanced security
                </p>
              </div>
              
              <div className="bg-card/60 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-warning" />
                  <p className="font-semibold text-foreground">Password Protection</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable leaked password protection
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-warning/30 text-warning hover:bg-warning hover:text-warning-foreground font-medium transition-all duration-200"
              >
                <a 
                  href="https://supabase.com/docs/guides/platform/going-into-prod#security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Security Guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-warning/30 text-warning hover:bg-warning hover:text-warning-foreground font-medium transition-all duration-200"
              >
                <a 
                  href="https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Password Security
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-warning/10"
            aria-label="Dismiss security warning"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};