/**
 * Offline Storage Utility using IndexedDB
 * Provides persistent storage for offline data
 */

const DB_NAME = 'kos-management-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  PENDING_REQUESTS: 'pending-requests',
  CACHED_DATA: 'cached-data',
  USER_DATA: 'user-data'
};

/**
 * Open IndexedDB connection
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for pending requests (offline queue)
      if (!db.objectStoreNames.contains(STORES.PENDING_REQUESTS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_REQUESTS, {
          keyPath: 'id',
          autoIncrement: true
        });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('type', 'type', { unique: false });
      }

      // Store for cached API data
      if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
        const cacheStore = db.createObjectStore(STORES.CACHED_DATA, {
          keyPath: 'key'
        });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
      }

      // Store for user-specific data
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Add item to store
 */
export const addToStore = async (storeName, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get item from store by key
 */
export const getFromStore = async (storeName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all items from store
 */
export const getAllFromStore = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Update item in store
 */
export const updateInStore = async (storeName, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete item from store
 */
export const deleteFromStore = async (storeName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clear all items from store
 */
export const clearStore = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ============================================
// OFFLINE REQUEST QUEUE
// ============================================

/**
 * Queue a request to be synced when online
 */
export const queueOfflineRequest = async (request) => {
  const pendingRequest = {
    ...request,
    timestamp: Date.now(),
    status: 'pending'
  };
  return addToStore(STORES.PENDING_REQUESTS, pendingRequest);
};

/**
 * Get all pending requests
 */
export const getPendingRequests = async () => {
  return getAllFromStore(STORES.PENDING_REQUESTS);
};

/**
 * Mark request as completed and remove it
 */
export const completePendingRequest = async (id) => {
  return deleteFromStore(STORES.PENDING_REQUESTS, id);
};

// ============================================
// CACHED DATA HELPERS
// ============================================

/**
 * Cache data with expiry
 */
export const cacheData = async (key, data, ttlMinutes = 60) => {
  const cacheEntry = {
    key,
    data,
    expiry: Date.now() + ttlMinutes * 60 * 1000,
    cachedAt: Date.now()
  };
  return updateInStore(STORES.CACHED_DATA, cacheEntry);
};

/**
 * Get cached data if not expired
 */
export const getCachedData = async (key) => {
  const entry = await getFromStore(STORES.CACHED_DATA, key);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() > entry.expiry) {
    await deleteFromStore(STORES.CACHED_DATA, key);
    return null;
  }
  
  return entry.data;
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = async () => {
  const allEntries = await getAllFromStore(STORES.CACHED_DATA);
  const now = Date.now();
  
  for (const entry of allEntries) {
    if (now > entry.expiry) {
      await deleteFromStore(STORES.CACHED_DATA, entry.key);
    }
  }
};

export default {
  openDB,
  addToStore,
  getFromStore,
  getAllFromStore,
  updateInStore,
  deleteFromStore,
  clearStore,
  queueOfflineRequest,
  getPendingRequests,
  completePendingRequest,
  cacheData,
  getCachedData,
  clearExpiredCache,
  STORES
};
