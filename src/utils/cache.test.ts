import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LocalStorageCache } from "./cache";

describe("LocalStorageCache", () => {
  beforeEach(() => {
    localStorage.clear();
    LocalStorageCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("get", () => {
    it("should return null for non-existent key", () => {
      const result = LocalStorageCache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should return value from localStorage", () => {
      const data = { key: "value" };
      localStorage.setItem("test-key", JSON.stringify(data));
      
      const result = LocalStorageCache.get("test-key");
      expect(result).toEqual(data);
    });

    it("should use cache within TTL", () => {
      const data = { key: "value" };
      
      // Pre-populate cache manually to avoid initial localStorage call
      LocalStorageCache.cache.set("test-key", { value: data, timestamp: Date.now() });
      
      // Clear mock call history
      const getItemSpy = vi.spyOn(localStorage, "getItem");
      
      // Call should use cache (no localStorage call expected)
      const result = LocalStorageCache.get("test-key");
      expect(result).toEqual(data);
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it("should refresh cache after TTL expires", () => {
      const data = { key: "value" };
      localStorage.setItem("test-key", JSON.stringify(data));
      
      // First call
      LocalStorageCache.get("test-key");
      
      // Advance time past TTL (5 seconds)
      vi.advanceTimersByTime(6000);
      
      // Second call - should read from localStorage again
      const getItemSpy = vi.spyOn(localStorage, "getItem");
      LocalStorageCache.get("test-key");
      expect(getItemSpy).toHaveBeenCalled();
    });

    it("should handle JSON parse errors", () => {
      localStorage.setItem("invalid-json", "not json");
      
      const consoleSpy = vi.spyOn(console, "error");
      const result = LocalStorageCache.get("invalid-json");
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("set", () => {
    it("should save to localStorage", () => {
      const data = { key: "value" };
      LocalStorageCache.set("test-key", data);
      
      const stored = JSON.parse(localStorage.getItem("test-key") || "");
      expect(stored).toEqual(data);
    });

    it("should update cache", () => {
      const data = { key: "value" };
      LocalStorageCache.set("test-key", data);
      
      // Should use cache
      const getItemSpy = vi.spyOn(localStorage, "getItem");
      LocalStorageCache.get("test-key");
      expect(getItemSpy).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should remove from localStorage", () => {
      localStorage.setItem("test-key", "value");
      LocalStorageCache.remove("test-key");
      
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("should remove from cache", () => {
      LocalStorageCache.set("test-key", { key: "value" });
      LocalStorageCache.remove("test-key");
      
      const getItemSpy = vi.spyOn(localStorage, "getItem");
      LocalStorageCache.get("test-key");
      expect(getItemSpy).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("should clear all cache", () => {
      LocalStorageCache.set("key1", "value1");
      LocalStorageCache.set("key2", "value2");
      
      LocalStorageCache.clear();
      
      const getItemSpy = vi.spyOn(localStorage, "getItem");
      LocalStorageCache.get("key1");
      LocalStorageCache.get("key2");
      
      expect(getItemSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidate", () => {
    it("should invalidate specific key", () => {
      LocalStorageCache.set("test-key", { key: "value" });
      LocalStorageCache.invalidate("test-key");
      
      const getItemSpy = vi.spyOn(localStorage, "getItem");
      LocalStorageCache.get("test-key");
      expect(getItemSpy).toHaveBeenCalled();
    });
  });
});
