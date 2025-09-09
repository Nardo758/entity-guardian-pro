import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Navigator interface for PWA support
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Check if PWA installation is supported
    const isPWASupported = 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
    setIsSupported(isPWASupported);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const nav = window.navigator as NavigatorWithStandalone;
    const isInWebApp = 'standalone' in nav || nav.standalone === true;
    setIsInstalled(isStandalone || isInWebApp);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      console.log('Showing install prompt');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        instruction: 'Click the three dots menu (⋮) → "Install Entity Renewal Pro"'
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        instruction: 'Click the three dots menu (⋯) → "Apps" → "Install this site as an app"'
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        instruction: 'Limited PWA support. Use bookmark or create desktop shortcut.'
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        instruction: 'Click Share button → "Add to Home Screen" (iOS) or "Add to Dock" (macOS)'
      };
    } else {
      return {
        browser: 'Your Browser',
        instruction: 'Look for "Install App" or "Add to Desktop" option in your browser menu'
      };
    }
  };

  return {
    isInstallable,
    isInstalled,
    isSupported,
    installApp,
    canInstall: Boolean(deferredPrompt),
    getBrowserInstructions
  };
};