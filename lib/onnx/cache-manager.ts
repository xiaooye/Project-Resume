/**
 * Cache Manager for Model Files
 * Handles browser caching strategy for Hugging Face models
 */

export class CacheManager {
  /**
   * Check if a model is cached in browser
   */
  static async isModelCached(modelId: string): Promise<boolean> {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return false;
    }

    try {
      // Transformers.js uses IndexedDB to cache models
      // The cache key format is: `hf-transformers/${modelId}/...`
      const dbName = "transformers-cache";
      return new Promise((resolve) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.length) {
            resolve(false);
            return;
          }
          // Check if model exists in cache
          const transaction = db.transaction(["models"], "readonly");
          const store = transaction.objectStore("models");
          const index = store.index("modelId");
          const getRequest = index.get(modelId);
          getRequest.onsuccess = () => {
            resolve(getRequest.result !== undefined);
          };
          getRequest.onerror = () => {
            resolve(false);
          };
        };
        request.onerror = () => {
          resolve(false);
        };
      });
    } catch (error) {
      console.warn("Failed to check cache:", error);
      return false;
    }
  }

  /**
   * Get cache size information
   */
  static async getCacheInfo(): Promise<{
    totalSize: number;
    modelCount: number;
  }> {
    if (typeof window === "undefined" || !("navigator" in window)) {
      return { totalSize: 0, modelCount: 0 };
    }

    try {
      // @ts-ignore - navigator.storage is experimental
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await (navigator.storage as any).estimate();
        return {
          totalSize: estimate.usage || 0,
          modelCount: 0, // Would need to query IndexedDB to get actual count
        };
      }
    } catch (error) {
      console.warn("Failed to get cache info:", error);
    }

    return { totalSize: 0, modelCount: 0 };
  }

  /**
   * Clear all cached models
   */
  static async clearCache(): Promise<void> {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return;
    }

    try {
      const dbName = "transformers-cache";
      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          console.log("Cache cleared successfully");
          resolve();
        };
        request.onerror = () => {
          console.error("Failed to clear cache");
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Failed to clear cache:", error);
      throw error;
    }
  }

  /**
   * Get human-readable cache size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }
}

