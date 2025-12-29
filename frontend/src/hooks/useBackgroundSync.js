import { useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getPendingRequests,
  completePendingRequest,
  queueOfflineRequest
} from '@utils/offlineStorage';
import toast from 'react-hot-toast';
import api from '@services/api';

/**
 * Hook to handle background sync of offline requests
 * Automatically syncs pending requests when coming back online
 */
export const useBackgroundSync = () => {
  const { isOnline } = useOnlineStatus();
  const isSyncing = useRef(false);

  const syncPendingRequests = useCallback(async () => {
    if (isSyncing.current) return;
    
    isSyncing.current = true;
    
    try {
      const pendingRequests = await getPendingRequests();
      
      if (pendingRequests.length === 0) {
        isSyncing.current = false;
        return;
      }

      toast.loading(`Menyinkronkan ${pendingRequests.length} permintaan...`, {
        id: 'sync-toast'
      });

      let successCount = 0;
      let failCount = 0;

      for (const request of pendingRequests) {
        try {
          // Replay the request
          await api({
            method: request.method,
            url: request.url,
            data: request.data,
            headers: request.headers
          });

          // Remove from pending queue
          await completePendingRequest(request.id);
          successCount++;
        } catch (error) {
          console.error('Failed to sync request:', error);
          failCount++;
          
          // If it's a permanent failure (4xx), remove from queue
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            await completePendingRequest(request.id);
          }
        }
      }

      toast.dismiss('sync-toast');

      if (successCount > 0) {
        toast.success(`${successCount} permintaan berhasil disinkronkan`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} permintaan gagal disinkronkan`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.dismiss('sync-toast');
    } finally {
      isSyncing.current = false;
    }
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      // Delay sync slightly to ensure stable connection
      const timer = setTimeout(syncPendingRequests, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncPendingRequests]);

  return {
    syncPendingRequests,
    queueRequest: queueOfflineRequest
  };
};

/**
 * Wrapper for API calls that queues failed requests when offline
 */
export const useOfflineAwareApi = () => {
  const { isOnline } = useOnlineStatus();

  const makeRequest = useCallback(async (config, options = {}) => {
    const { queueIfOffline = false, requestType = 'unknown' } = options;

    try {
      const response = await api(config);
      return response;
    } catch (error) {
      // If offline and should queue
      if (!isOnline && queueIfOffline && config.method !== 'GET') {
        await queueOfflineRequest({
          method: config.method,
          url: config.url,
          data: config.data,
          headers: config.headers,
          type: requestType
        });

        toast.success('Permintaan disimpan untuk dikirim saat online', {
          icon: '📤'
        });

        return { queued: true };
      }

      throw error;
    }
  }, [isOnline]);

  return { makeRequest, isOnline };
};

export default useBackgroundSync;
