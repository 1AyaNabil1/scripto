/**
 * Image caching utilities for optimized UX
 * Supports in-memory cache, IndexedDB persistence, and automatic cleanup
 */

// In-memory cache for quick access
const memoryCache = new Map<string, string>();

// Cache configuration
const CACHE_CONFIG = {
  maxMemoryEntries: 100,
  maxIndexedDBEntries: 500,
  cacheDurationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  dbName: 'Scripto-image-cache',
  storeName: 'images',
  version: 1
};

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
  originalUrl: string;
}

class ImageCacheManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_CONFIG.dbName, CACHE_CONFIG.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CACHE_CONFIG.storeName)) {
          const store = db.createObjectStore(CACHE_CONFIG.storeName, { keyPath: 'originalUrl' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_CONFIG.cacheDurationMs;
  }

  private async cleanupMemoryCache(): Promise<void> {
    if (memoryCache.size <= CACHE_CONFIG.maxMemoryEntries) return;

    // Convert to array, sort by usage, keep only the most recent entries
    const entries = Array.from(memoryCache.entries());
    const toRemove = entries.slice(0, entries.length - CACHE_CONFIG.maxMemoryEntries);
    
    toRemove.forEach(([key, url]) => {
      URL.revokeObjectURL(url);
      memoryCache.delete(key);
    });
  }

  private async cleanupIndexedDB(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([CACHE_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      
      const countRequest = store.count();
      countRequest.onsuccess = async () => {
        if (countRequest.result <= CACHE_CONFIG.maxIndexedDBEntries) return;

        // Get all entries sorted by timestamp
        const getAllRequest = store.index('timestamp').openCursor();
        const toDelete: string[] = [];
        let count = 0;

        getAllRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const data = cursor.value as CachedImage;
            if (this.isExpired(data.timestamp) || count < countRequest.result - CACHE_CONFIG.maxIndexedDBEntries) {
              toDelete.push(data.originalUrl);
            }
            count++;
            cursor.continue();
          } else {
            // Delete expired and excess entries
            toDelete.forEach(url => store.delete(url));
          }
        };
      };
    } catch (error) {
      console.warn('Failed to cleanup IndexedDB cache:', error);
    }
  }

  async getFromMemory(url: string): Promise<string | null> {
    return memoryCache.get(url) || null;
  }

  async getFromIndexedDB(url: string): Promise<string | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([CACHE_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.storeName);

      return new Promise((resolve) => {
        const request = store.get(url);
        request.onsuccess = () => {
          const result = request.result as CachedImage | undefined;
          if (result && !this.isExpired(result.timestamp)) {
            // Create object URL from stored blob
            const objectUrl = URL.createObjectURL(result.blob);
            // Also store in memory cache for faster future access
            memoryCache.set(url, objectUrl);
            resolve(objectUrl);
          } else {
            // Remove expired entry
            if (result) {
              store.delete(url);
            }
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn('Failed to get from IndexedDB cache:', error);
      return null;
    }
  }

  async storeInMemory(url: string, objectUrl: string): Promise<void> {
    memoryCache.set(url, objectUrl);
    await this.cleanupMemoryCache();
  }

  async storeInIndexedDB(url: string, blob: Blob): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([CACHE_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.storeName);

      const cachedImage: CachedImage = {
        originalUrl: url,
        url: URL.createObjectURL(blob),
        blob,
        timestamp: Date.now()
      };

      store.put(cachedImage);
      await this.cleanupIndexedDB();
    } catch (error) {
      console.warn('Failed to store in IndexedDB cache:', error);
    }
  }

  async fetchAndCache(url: string): Promise<string> {
    try {
      // First, try with CORS mode to check if CORS is allowed
      let response;
      try {
        response = await fetch(url, { mode: 'cors' });
      } catch (corsError) {
        // If CORS fails, we can't cache the image but can still use it directly
        console.warn('CORS blocked for image caching, using direct URL:', url);
        throw new Error('CORS_BLOCKED');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Store in both caches
      await this.storeInMemory(url, objectUrl);
      await this.storeInIndexedDB(url, blob);

      return objectUrl;
    } catch (error) {
      if (error instanceof Error && error.message === 'CORS_BLOCKED') {
        // Don't log CORS errors as failures - they're expected for unconfigured blob storage
        throw error;
      }
      console.error('Failed to fetch and cache image:', error);
      throw error;
    }
  }

  async getCachedImage(url: string): Promise<string> {
    // Check memory cache first (fastest)
    let cachedUrl = await this.getFromMemory(url);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Check IndexedDB cache (persistent)
    cachedUrl = await this.getFromIndexedDB(url);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Fetch and cache if not found
    return await this.fetchAndCache(url);
  }

  clearMemoryCache(): void {
    memoryCache.forEach((url) => URL.revokeObjectURL(url));
    memoryCache.clear();
  }

  async clearIndexedDBCache(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([CACHE_CONFIG.storeName], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      store.clear();
    } catch (error) {
      console.warn('Failed to clear IndexedDB cache:', error);
    }
  }

  async clearAllCaches(): Promise<void> {
    this.clearMemoryCache();
    await this.clearIndexedDBCache();
  }

  async getCacheStats(): Promise<{ memoryCount: number; indexedDBCount: number }> {
    const memoryCount = memoryCache.size;
    
    let indexedDBCount = 0;
    try {
      const db = await this.initDB();
      const transaction = db.transaction([CACHE_CONFIG.storeName], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.storeName);
      
      indexedDBCount = await new Promise((resolve) => {
        const countRequest = store.count();
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      });
    } catch (error) {
      console.warn('Failed to get IndexedDB cache stats:', error);
    }

    return { memoryCount, indexedDBCount };
  }
}

// Export singleton instance
export const imageCache = new ImageCacheManager();

// Helper function for easy use
export async function getCachedImageUrl(url: string): Promise<string> {
  if (!url) return '';
  
  try {
    return await imageCache.getCachedImage(url);
  } catch (error) {
    // Check if it's a CORS error - don't log these as errors
    if (error instanceof Error && error.message === 'CORS_BLOCKED') {
      console.info('Image caching blocked by CORS, using direct URL:', url);
      return url; // Fallback to original URL
    }
    
    console.error('Failed to get cached image, falling back to original URL:', error);
    return url; // Fallback to original URL
  }
}

// Preload images for better UX
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => 
    getCachedImageUrl(url).catch(error => {
      // Only log non-CORS errors as warnings
      if (!(error instanceof Error && error.message === 'CORS_BLOCKED')) {
        console.warn(`Failed to preload image ${url}:`, error);
      }
    })
  );
  
  await Promise.allSettled(promises);
}
