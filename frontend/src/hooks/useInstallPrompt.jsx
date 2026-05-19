import { useState, useEffect } from 'react';

const getStandaloneStatus = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const getIOSInstallPromptStatus = () => {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream && !getStandaloneStatus();
};

/**
 * Hook to manage the beforeinstallprompt event and installation state.
 * Detects if the app is installable and provides the install function.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(getStandaloneStatus);
  const [isIOS] = useState(getIOSInstallPromptStatus);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt (Android, some desktop browsers)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  return {
    canInstall,
    isInstalled,
    isIOS,
    installApp,
    showPrompt: canInstall || (isIOS && !isInstalled),
  };
}
