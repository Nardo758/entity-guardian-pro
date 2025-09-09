import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const { installApp, isInstallable, isInstalled } = usePWA();
  const { toast } = useToast();

  if (!isInstallable || isInstalled) return null;

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast({
        title: "App Installed! 🎉",
        description: "Entity Renewal Pro has been added to your desktop.",
      });
      onDismiss?.();
    } else {
      toast({
        title: "Installation Cancelled",
        description: "You can install the app later from your browser menu.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 max-w-sm shadow-lg border-primary/20 z-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Install Entity Renewal Pro
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Add to your desktop for quick access and offline capabilities
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="text-xs h-7"
              >
                Install App
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                className="text-xs h-7 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;