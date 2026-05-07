/**
 * localStorage 缓存工具
 * 减少重复读取，提高性能
 */

export class LocalStorageCache {
  private static cache = new Map<string, { value: any; timestamp: number }>();
  private static readonly TTL = 5000; // 5秒缓存

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.value;
    }

    try {
      const item = localStorage.getItem(key);
      if (item) {
        const value = JSON.parse(item);
        this.cache.set(key, { value, timestamp: Date.now() });
        return value;
      }
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
    }

    return null;
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.cache.set(key, { value, timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
      this.cache.delete(key);
    } catch (e) {
      console.error('Failed to remove from localStorage:', e);
    }
  }

  static clear(): void {
    this.cache.clear();
  }

  static invalidate(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * 便捷函数
 */
export function getCache<T>(key: string): T | null {
  return LocalStorageCache.get<T>(key);
}

export function setCache<T>(key: string, value: T): void {
  LocalStorageCache.set<T>(key, value);
}

export function removeCache(key: string): void {
  LocalStorageCache.remove(key);
}

export function clearCache(): void {
  LocalStorageCache.clear();
}
