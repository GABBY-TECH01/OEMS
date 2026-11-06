import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt) {
      return (window as any).__pwaDeferredPrompt;
    }
    return null;
  });
  const [isInstallable, setIsInstallable] = useState(() => Boolean((window as any)?.__pwaDeferredPrompt));
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if running in pure standalone window (installed PWA)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standaloneMode);

    // Detect Device OS
    const userAgent = (window.navigator?.userAgent || '').toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // If global prompt was already caught
    if ((window as any).__pwaDeferredPrompt) {
      setDeferredPrompt((window as any).__pwaDeferredPrompt);
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      (window as any).__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerNativeInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPrompt || (window as any).__pwaDeferredPrompt;
    if (!promptEvent) {
      return 'unsupported';
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        (window as any).__pwaDeferredPrompt = null;
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
      return choice.outcome;
    } catch (err) {
      console.warn('Native PWA install prompt error:', err);
      return 'dismissed';
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isStandalone,
    isIOS,
    isAndroid,
    hasNativePrompt: Boolean(deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt)),
    triggerNativeInstall,
  };
}
