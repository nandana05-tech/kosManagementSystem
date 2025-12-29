import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect online/offline status
 * @returns {Object} { isOnline, isOffline, lastOnlineTime }
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState(
    navigator.onLine ? new Date() : null
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineTime
  };
};

/**
 * Custom hook to handle PWA updates
 * @returns {Object} { needRefresh, offlineReady, updateServiceWorker }
 */
export const usePWA = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Only run in production with service worker
    if ('serviceWorker' in navigator) {
      // Listen for SW updates
      const handleControllerChange = () => {
        setNeedRefresh(true);
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Check registration status
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        setOfflineReady(true);
      });

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration && registration.waiting) {
      // Tell waiting SW to take control
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload the page to get new content
    window.location.reload();
  }, [registration]);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker
  };
};

export default useOnlineStatus;
