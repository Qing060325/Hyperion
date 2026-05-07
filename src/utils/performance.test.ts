import { describe, it, expect, beforeEach, vi } from "vitest";
import { performanceMonitor, trackMetric, trackError, trackAction } from "./performance";

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    performanceMonitor.clear();
    vi.clearAllMocks();
  });

  describe("logMetric", () => {
    it("should log metric", () => {
      trackMetric("test-metric", 100, { type: "test" });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe("test-metric");
      expect(metrics[0].value).toBe(100);
    });

    it("should limit metrics to maxLogs", () => {
      for (let i = 0; i < 150; i++) {
        trackMetric(`metric-${i}`, i);
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe("logError", () => {
    it("should log error", () => {
      trackError("Test error", "stack trace", { context: "test" });
      
      const errors = performanceMonitor.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Test error");
      expect(errors[0].stack).toBe("stack trace");
    });

    it("should limit errors to maxLogs", () => {
      for (let i = 0; i < 150; i++) {
        trackError(`error-${i}`);
      }
      
      const errors = performanceMonitor.getErrors();
      expect(errors.length).toBeLessThanOrEqual(100);
    });
  });

  describe("logAction", () => {
    it("should log user action", () => {
      trackAction("click", "button", { id: "submit" });
      
      const actions = performanceMonitor.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe("click");
      expect(actions[0].category).toBe("button");
    });

    it("should limit actions to maxLogs", () => {
      for (let i = 0; i < 150; i++) {
        trackAction(`action-${i}`, "test");
      }
      
      const actions = performanceMonitor.getActions();
      expect(actions.length).toBeLessThanOrEqual(100);
    });
  });

  describe("getReport", () => {
    it("should return complete report", () => {
      trackMetric("metric-1", 100);
      trackError("error-1");
      trackAction("action-1", "test");
      
      const report = performanceMonitor.getReport();
      
      expect(report.metrics).toHaveLength(1);
      expect(report.errors).toHaveLength(1);
      expect(report.actions).toHaveLength(1);
      expect(report.summary.totalMetrics).toBe(1);
      expect(report.summary.totalErrors).toBe(1);
      expect(report.summary.totalActions).toBe(1);
    });
  });

  describe("clear", () => {
    it("should clear all logs", () => {
      trackMetric("metric-1", 100);
      trackError("error-1");
      trackAction("action-1", "test");
      
      performanceMonitor.clear();
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
      expect(performanceMonitor.getErrors()).toHaveLength(0);
      expect(performanceMonitor.getActions()).toHaveLength(0);
    });
  });
});
