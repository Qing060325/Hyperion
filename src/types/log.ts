// ==========================================
// Log Extended Type Definitions
// ==========================================

/** Log level */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'silent';

/** Extended log entry */
export interface LogEntryExtended {
  id: string;
  timestamp: Date;
  level: LogLevel;
  payload: string;
  process?: string;
  highlighted?: boolean;
}

/** Log filter options */
export interface LogFilter {
  level: LogLevel[];
  keywords: string[];
  startTime?: Date;
  endTime?: Date;
  process?: string;
  excludeKeywords: string[];
}

/** Log export options */
export interface LogExportOptions {
  format: 'txt' | 'json' | 'csv';
  includeTimestamp: boolean;
  includeLevel: boolean;
  filter: LogFilter;
}

/** Log statistics */
export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  errors: number;
  warnings: number;
  lastError?: LogEntryExtended;
}

/** Log preset filter */
export interface LogPreset {
  id: string;
  name: string;
  filter: LogFilter;
}

/** Predefined log presets */
export const LOG_PRESETS: LogPreset[] = [
  {
    id: 'all',
    name: '全部',
    filter: { level: ['debug', 'info', 'warning', 'error'], keywords: [], excludeKeywords: [] }
  },
  {
    id: 'errors',
    name: '错误',
    filter: { level: ['error'], keywords: [], excludeKeywords: [] }
  },
  {
    id: 'warnings',
    name: '警告及以上',
    filter: { level: ['warning', 'error'], keywords: [], excludeKeywords: [] }
  },
  {
    id: 'important',
    name: '重要',
    filter: { level: ['info', 'warning', 'error'], keywords: [], excludeKeywords: ['debug'] }
  }
];
