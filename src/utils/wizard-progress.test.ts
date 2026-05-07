import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { WizardProgressManager, type WizardProgress } from "./wizard-progress";
import { LocalStorageCache } from "./cache";

describe("WizardProgressManager", () => {
  beforeEach(() => {
    localStorage.clear();
    LocalStorageCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("save", () => {
    it("should save progress to localStorage", () => {
      const progress: WizardProgress = {
        currentStep: "configure",
        completedSteps: ["welcome", "detect"],
        timestamp: Date.now(),
      };
      
      WizardProgressManager.save(progress);
      
      const stored = JSON.parse(localStorage.getItem("hyperion-wizard-progress") || "");
      expect(stored.currentStep).toBe("configure");
      expect(stored.completedSteps).toEqual(["welcome", "detect"]);
    });

    it("should add timestamp", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: [],
        timestamp: 0,
      };
      
      const now = Date.now();
      vi.setSystemTime(now);
      
      WizardProgressManager.save(progress);
      
      const stored = JSON.parse(localStorage.getItem("hyperion-wizard-progress") || "");
      expect(stored.timestamp).toBe(now);
    });
  });

  describe("load", () => {
    it("should return null for non-existent progress", () => {
      const result = WizardProgressManager.load();
      expect(result).toBeNull();
    });

    it("should load saved progress", () => {
      const progress: WizardProgress = {
        currentStep: "configure",
        completedSteps: ["welcome", "detect"],
        timestamp: Date.now(),
      };
      
      localStorage.setItem("hyperion-wizard-progress", JSON.stringify(progress));
      
      const result = WizardProgressManager.load();
      expect(result).toEqual(progress);
    });
  });

  describe("clear", () => {
    it("should clear progress from localStorage", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: [],
        timestamp: Date.now(),
      };
      
      localStorage.setItem("hyperion-wizard-progress", JSON.stringify(progress));
      WizardProgressManager.clear();
      
      expect(localStorage.getItem("hyperion-wizard-progress")).toBeNull();
    });
  });

  describe("isExpired", () => {
    it("should return false for fresh progress", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: [],
        timestamp: Date.now(),
      };
      
      expect(WizardProgressManager.isExpired(progress)).toBe(false);
    });

    it("should return true for expired progress", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: [],
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      };
      
      expect(WizardProgressManager.isExpired(progress)).toBe(true);
    });

    it("should use custom maxAge", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: [],
        timestamp: Date.now() - 2000, // 2 seconds ago
      };
      
      expect(WizardProgressManager.isExpired(progress, 1000)).toBe(true);
      expect(WizardProgressManager.isExpired(progress, 3000)).toBe(false);
    });
  });

  describe("markStepCompleted", () => {
    it("should add step to completedSteps", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: [],
        timestamp: Date.now(),
      };
      
      localStorage.setItem("hyperion-wizard-progress", JSON.stringify(progress));
      
      WizardProgressManager.markStepCompleted("detect");
      
      const result = WizardProgressManager.load();
      expect(result?.completedSteps).toContain("detect");
    });

    it("should not duplicate steps", () => {
      const progress: WizardProgress = {
        currentStep: "welcome",
        completedSteps: ["detect"],
        timestamp: Date.now(),
      };
      
      localStorage.setItem("hyperion-wizard-progress", JSON.stringify(progress));
      
      WizardProgressManager.markStepCompleted("detect");
      
      const result = WizardProgressManager.load();
      expect(result?.completedSteps.filter(s => s === "detect")).toHaveLength(1);
    });

    it("should create progress if not exists", () => {
      WizardProgressManager.markStepCompleted("welcome");
      
      const result = WizardProgressManager.load();
      expect(result).not.toBeNull();
      expect(result?.completedSteps).toContain("welcome");
    });
  });

  describe("getNextStep", () => {
    it("should return next step", () => {
      expect(WizardProgressManager.getNextStep("welcome")).toBe("detect");
      expect(WizardProgressManager.getNextStep("detect")).toBe("configure");
      expect(WizardProgressManager.getNextStep("configure")).toBe("complete");
    });

    it("should return null for last step", () => {
      expect(WizardProgressManager.getNextStep("complete")).toBeNull();
    });

    it("should return null for invalid step", () => {
      expect(WizardProgressManager.getNextStep("invalid")).toBeNull();
    });
  });
});
