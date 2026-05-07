/**
 * 性能监控工具
 * 收集性能指标、错误监控、用户行为分析
 */

import { logger, logEmoji } from "./logger";

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface UserAction {
  action: string;
  category: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorLog[] = [];
  private actions: UserAction[] = [];
  private maxLogs = 100;

  constructor() {
    this.setupErrorHandling();
    this.setupPerformanceObserver();
  }

  private setupErrorHandling() {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        timestamp: Date.now(),
        context: {
          type: "unhandledrejection",
        },
      });
    });
  }

  private setupPerformanceObserver() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    try {
      // 观察长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logMetric({
            name: "long-task",
            value: entry.duration,
            timestamp: Date.now(),
            tags: {
              type: "performance",
            },
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });

      // 观察 layout shift
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ("value" in entry) {
            this.logMetric({
              name: "layout-shift",
              value: entry.value as number,
              timestamp: Date.now(),
              tags: {
                type: "performance",
              },
            });
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      logger.debug(`${logEmoji.debug} Performance observer not supported`);
    }
  }

  logMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxLogs) {
      this.metrics.shift();
    }
    logger.debug(`${logEmoji.debug} Metric: ${metric.name} = ${metric.value}`);
  }

  logError(error: ErrorLog) {
    this.errors.push(error);
    if (this.errors.length > this.maxLogs) {
      this.errors.shift();
    }
    logger.error(`${logEmoji.error} Error: ${error.message}`);
  }

  logAction(action: UserAction) {
    this.actions.push(action);
    if (this.actions.length > this.maxLogs) {
      this.actions.shift();
    }
    logger.debug(`${logEmoji.debug} Action: ${action.category}/${action.action}`);
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  getActions(): UserAction[] {
    return [...this.actions];
  }

  clear() {
    this.metrics = [];
    this.errors = [];
    this.actions = [];
  }

  getReport() {
    return {
      metrics: this.getMetrics(),
      errors: this.getErrors(),
      actions: this.getActions(),
      summary: {
        totalMetrics: this.metrics.length,
        totalErrors: this.errors.length,
        totalActions: this.actions.length,
      },
    };
  }

  // Web Vitals
  measureWebVitals() {
    if (typeof window === "undefined") return;

    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
    if (fcpEntry) {
      this.logMetric({
        name: "FCP",
        value: fcpEntry.startTime,
        timestamp: Date.now(),
        tags: { type: "web-vital" },
      });
    }

    // Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.logMetric({
            name: "LCP",
            value: lastEntry.startTime,
            timestamp: Date.now(),
            tags: { type: "web-vital" },
          });
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // Ignore
      }
    }

    // Time to Interactive (approximation)
    window.addEventListener("load", () => {
      setTimeout(() => {
        this.logMetric({
          name: "TTI",
          value: performance.now(),
          timestamp: Date.now(),
          tags: { type: "web-vital" },
        });
      }, 0);
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 便捷方法
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  performanceMonitor.logMetric({ name, value, timestamp: Date.now(), tags });
};

export const trackError = (message: string, stack?: string, context?: Record<string, any>) => {
  performanceMonitor.logError({ message, stack, timestamp: Date.now(), context });
};

export const trackAction = (action: string, category: string, metadata?: Record<string, any>) => {
  performanceMonitor.logAction({ action, category, timestamp: Date.now(), metadata });
};
