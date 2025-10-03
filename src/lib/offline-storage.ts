interface OfflineData {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount: number;
  type: 'sample' | 'photo' | 'location';
}

interface StoredSample {
  id?: string;
  sampleData: any;
  timestamp: number;
  synced: boolean;
  photos?: string[];
}

class OfflineStorage {
  private dbName = 'AmritDharaOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for pending API requests
        if (!db.objectStoreNames.contains('pendingRequests')) {
          const pendingStore = db.createObjectStore('pendingRequests', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('type', 'type', { unique: false });
        }

        // Store for sample data
        if (!db.objectStoreNames.contains('samples')) {
          const sampleStore = db.createObjectStore('samples', { 
            keyPath: 'id', 
            autoIncrement: false 
          });
          sampleStore.createIndex('timestamp', 'timestamp', { unique: false });
          sampleStore.createIndex('synced', 'synced', { unique: false });
        }

        // Store for photos
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          photoStore.createIndex('sampleId', 'sampleId', { unique: false });
          photoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for app settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Store pending API request for later sync
  async storePendingRequest(data: Omit<OfflineData, 'id' | 'retryCount'>): Promise<number> {
    if (!this.db) await this.init();

    const requestData: OfflineData = {
      ...data,
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const request = store.add(requestData);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending requests
  async getPendingRequests(): Promise<OfflineData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readonly');
      const store = transaction.objectStore('pendingRequests');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove a pending request after successful sync
  async removePendingRequest(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store sample data locally
  async storeSample(sampleData: any, photos?: string[]): Promise<string> {
    if (!this.db) await this.init();

    const sample: StoredSample = {
      id: sampleData.sampleId || `offline_${Date.now()}`,
      sampleData,
      timestamp: Date.now(),
      synced: false,
      photos,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readwrite');
      const store = transaction.objectStore('samples');
      const request = store.put(sample);

      request.onsuccess = () => resolve(sample.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all stored samples
  async getStoredSamples(): Promise<StoredSample[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readonly');
      const store = transaction.objectStore('samples');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced samples
  async getUnsyncedSamples(): Promise<StoredSample[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readonly');
      const store = transaction.objectStore('samples');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark sample as synced
  async markSampleAsSynced(sampleId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readwrite');
      const store = transaction.objectStore('samples');
      
      const getRequest = store.get(sampleId);
      getRequest.onsuccess = () => {
        const sample = getRequest.result;
        if (sample) {
          sample.synced = true;
          const updateRequest = store.put(sample);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Sample not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Store photo data
  async storePhoto(sampleId: string, photoData: string, photoName: string): Promise<number> {
    if (!this.db) await this.init();

    const photo = {
      sampleId,
      data: photoData,
      name: photoName,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.add(photo);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  // Get photos for a sample
  async getSamplePhotos(sampleId: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('sampleId');
      const request = index.getAll(sampleId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete synced samples older than specified days
  async cleanupOldSyncedSamples(daysToKeep: number = 30): Promise<void> {
    if (!this.db) await this.init();

    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readwrite');
      const store = transaction.objectStore('samples');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const sample = cursor.value;
          if (sample.timestamp < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; available: number; samples: number; photos: number }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const samplesTransaction = this.db!.transaction(['samples'], 'readonly');
      const photosTransaction = this.db!.transaction(['photos'], 'readonly');
      
      const samplesStore = samplesTransaction.objectStore('samples');
      const photosStore = photosTransaction.objectStore('photos');
      
      const samplesRequest = samplesStore.count();
      const photosRequest = photosStore.count();
      
      Promise.all([
        new Promise<number>((res, rej) => {
          samplesRequest.onsuccess = () => res(samplesRequest.result);
          samplesRequest.onerror = () => rej(samplesRequest.error);
        }),
        new Promise<number>((res, rej) => {
          photosRequest.onsuccess = () => res(photosRequest.result);
          photosRequest.onerror = () => rej(photosRequest.error);
        })
      ]).then(([sampleCount, photoCount]) => {
        // Estimate storage usage (rough calculation)
        const estimatedUsage = sampleCount * 1024 + photoCount * 500 * 1024; // 1KB per sample, 500KB per photo
        const estimatedAvailable = 50 * 1024 * 1024; // 50MB estimated quota
        
        resolve({
          used: estimatedUsage,
          available: estimatedAvailable,
          samples: sampleCount,
          photos: photoCount
        });
      }).catch(reject);
    });
  }

  // Store app settings
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get app setting
  async getSetting(key: string, defaultValue: any = null): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Sync manager for handling background sync
export class SyncManager {
  private isSyncing = false;
  private syncCallbacks: Array<(success: number, failed: number) => void> = [];

  async syncPendingData(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingRequests = await offlineStorage.getPendingRequests();
      
      for (const request of pendingRequests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });

          if (response.ok) {
            await offlineStorage.removePendingRequest(request.id!);
            successCount++;
          } else {
            failedCount++;
            // Update retry count
            request.retryCount++;
            if (request.retryCount >= 3) {
              await offlineStorage.removePendingRequest(request.id!);
            }
          }
        } catch (error) {
          failedCount++;
          console.error('Failed to sync request:', error);
        }
      }

      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback(successCount, failedCount));

    } catch (error) {
      console.error('Sync failed:', error);
      failedCount++;
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  onSyncComplete(callback: (success: number, failed: number) => void): void {
    this.syncCallbacks.push(callback);
  }

  removeSyncCallback(callback: (success: number, failed: number) => void): void {
    const index = this.syncCallbacks.indexOf(callback);
    if (index > -1) {
      this.syncCallbacks.splice(index, 1);
    }
  }
}

export const syncManager = new SyncManager();