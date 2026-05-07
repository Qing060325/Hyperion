import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger, logEmoji } from "./logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.debug = vi.fn();
  });

  describe("logEmoji", () => {
    it("should have all emoji defined", () => {
      expect(logEmoji.success).toBe("✅");
      expect(logEmoji.error).toBe("❌");
      expect(logEmoji.warning).toBe("⚠️");
      expect(logEmoji.info).toBe("ℹ️");
      expect(logEmoji.debug).toBe("🔍");
      expect(logEmoji.wizard).toBe("🧙");
      expect(logEmoji.settings).toBe("⚙️");
      expect(logEmoji.connection).toBe("🔗");
    });
  });

  describe("logger methods", () => {
    it("should call console.log with logger.log", () => {
      logger.log("test message");
      expect(console.log).toHaveBeenCalledWith("test message");
    });

    it("should call console.info with logger.info", () => {
      logger.info("test message");
      expect(console.info).toHaveBeenCalledWith("test message");
    });

    it("should call console.warn with logger.warn", () => {
      logger.warn("test message");
      expect(console.warn).toHaveBeenCalledWith("test message");
    });

    it("should call console.error with logger.error", () => {
      logger.error("test message");
      expect(console.error).toHaveBeenCalledWith("test message");
    });

    it("should call console.debug with logger.debug", () => {
      logger.debug("test message");
      expect(console.debug).toHaveBeenCalledWith("test message");
    });

    it("should handle multiple arguments", () => {
      logger.log("message", { key: "value" }, 123);
      expect(console.log).toHaveBeenCalledWith("message", { key: "value" }, 123);
    });
  });
});
