// ==========================================
// Clash Kernel Detector Service
// ==========================================

import type { ClashConnectionConfig, ClashVersion } from '../types/clash';

export interface ClashDetectionResult {
  found: boolean;
  path?: string;
  version?: string;
  meta?: boolean;
  error?: string;
}

/** Common Clash installation paths */
const CLASH_PATHS = {
  win32: [
    'C:\\Program Files\\Clash\\clash.exe',
    'C:\\Program Files (x86)\\Clash\\clash.exe',
    'C:\\Users\\{user}\\AppData\\Local\\Programs\\clash\\clash.exe',
    'C:\\Users\\{user}\\.config\\clash\\clash.exe',
    'C:\\Program Files\\Clash for Windows\\resources\\app\\.data\\clash.exe',
  ],
  darwin: [
    '/Applications/Clash for Windows.app/Contents/Resources/app/.data/clash',
    '/Applications/ClashX.app/Contents/Resources/clash',
    '/usr/local/bin/clash',
    '/opt/homebrew/bin/clash',
    '~/.config/clash/clash',
  ],
  linux: [
    '/usr/bin/clash',
    '/usr/local/bin/clash',
    '/opt/clash/clash',
    '~/.local/bin/clash',
    '~/.config/clash/clash',
  ],
};

/** Default Clash ports */
const DEFAULT_PORTS = [9090, 9091, 9092, 9093, 9094];
const DEFAULT_HOSTS = ['127.0.0.1', 'localhost'];

class ClashDetectorService {
  /**
   * Detect local Clash kernel
   */
  async detectLocalClash(): Promise<ClashDetectionResult> {
    const platform = navigator.platform.toLowerCase();
    const isWin = platform.includes('win');
    const isMac = platform.includes('mac');
    
    // Try to detect via WebSocket first
    for (const host of DEFAULT_HOSTS) {
      for (const port of DEFAULT_PORTS) {
        try {
          const result = await this.testConnection({ host, port });
          if (result) {
            return {
              found: true,
              path: `${host}:${port}`,
              version: result.version,
              meta: result.meta,
            };
          }
        } catch {
          continue;
        }
      }
    }
    
    return {
      found: false,
      error: '未检测到运行中的 Clash 内核',
    };
  }

  /**
   * Test connection to Clash API
   */
  async testConnection(config: ClashConnectionConfig): Promise<ClashVersion | null> {
    try {
      const url = `http://${config.host}:${config.port}/version`;
      const headers: HeadersInit = {};
      
      if (config.secret) {
        headers['Authorization'] = `Bearer ${config.secret}`;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return {
          version: data.version || 'unknown',
          meta: data.meta ?? data.premium ?? false,
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get recommended connection config
   */
  getRecommendedConfig(): ClashConnectionConfig {
    return {
      host: '127.0.0.1',
      port: 9090,
      secret: '',
    };
  }

  /**
   * Scan for Clash instances on network
   */
  async scanNetwork(baseIP: string = '192.168.1'): Promise<ClashDetectionResult[]> {
    const results: ClashDetectionResult[] = [];
    
    // Scan limited range for safety
    for (let i = 1; i <= 10; i++) {
      const host = `${baseIP}.${i}`;
      for (const port of DEFAULT_PORTS) {
        try {
          const result = await this.testConnection({ host, port });
          if (result) {
            results.push({
              found: true,
              path: `${host}:${port}`,
              version: result.version,
              meta: result.meta,
            });
          }
        } catch {
          continue;
        }
      }
    }
    
    return results;
  }

  /**
   * Validate connection config
   */
  validateConfig(config: ClashConnectionConfig): { valid: boolean; error?: string } {
    if (!config.host) {
      return { valid: false, error: '请输入 API 地址' };
    }
    
    if (!config.port || config.port < 1 || config.port > 65535) {
      return { valid: false, error: '端口号必须在 1-65535 之间' };
    }
    
    return { valid: true };
  }
}

export const clashDetector = new ClashDetectorService();
