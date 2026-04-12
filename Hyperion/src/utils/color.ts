// ==========================================
// Delay Color Utilities
// ==========================================

export type DelayLevel = "excellent" | "good" | "medium" | "poor" | "unknown";

export interface DelayColor {
  bg: string;
  text: string;
  border: string;
}

const DELAY_COLORS: Record<DelayLevel, DelayColor> = {
  excellent: {
    bg: "rgba(16, 185, 129, 0.15)",
    text: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
  },
  good: {
    bg: "rgba(6, 182, 212, 0.15)",
    text: "#06b6d4",
    border: "rgba(6, 182, 212, 0.3)",
  },
  medium: {
    bg: "rgba(245, 158, 11, 0.15)",
    text: "#f59e0b",
    border: "rgba(245, 158, 11, 0.3)",
  },
  poor: {
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
  unknown: {
    bg: "rgba(71, 85, 105, 0.15)",
    text: "#475569",
    border: "rgba(71, 85, 105, 0.3)",
  },
};

export function getDelayLevel(delay: number | undefined | null): DelayLevel {
  if (delay === undefined || delay === null || delay === 0) return "unknown";
  if (delay <= 100) return "excellent";
  if (delay <= 300) return "good";
  if (delay <= 500) return "medium";
  return "poor";
}

export function getDelayColor(delay: number | undefined | null): DelayColor {
  return DELAY_COLORS[getDelayLevel(delay)];
}

export function getDelayTextColor(delay: number | undefined | null): string {
  return getDelayColor(delay).text;
}

export function getDelayBgColor(delay: number | undefined | null): string {
  return getDelayColor(delay).bg;
}

/**
 * Format delay for display
 */
export function formatDelay(delay: number | undefined | null): string {
  if (delay === undefined || delay === null || delay === 0) return "---";
  return `${delay}ms`;
}
