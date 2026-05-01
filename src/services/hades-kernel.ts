/**
 * Hades 内核管理服务
 * 处理与 Hades 内核的通信和安装管理
 */

import { VersionInfo, UpgradeStatus } from "@/types/hades-api";

export interface KernelInstallOptions {
  version?: string;
  force?: boolean;
}

export interface KernelStatus {
  installed: boolean;
  version: string;
  buildTime: string;
  goVersion: string;
  lastChecked: Date;
}

class HadesKernelService {
  private baseUrl = "http://localhost:9090";
  private checkInterval = 30000; // 30 秒

  /**
   * 检查 Hades 内核是否可用
   */
  async checkKernelAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/version`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取 Hades 内核版本信息
   */
  async getKernelVersion(): Promise<VersionInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/version`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("获取内核版本失败:", error);
      return null;
    }
  }

  /**
   * 获取内核升级状态
   */
  async getUpgradeStatus(): Promise<UpgradeStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/upgrade-status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("获取升级状态失败:", error);
      return null;
    }
  }

  /**
   * 安装 Hades 内核
   */
  async installKernel(options: KernelInstallOptions = {}): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/install`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "install",
          version: options.version || "latest",
          force: options.force || false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `安装失败 (HTTP ${response.status})`
        );
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "安装成功",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "安装过程中出错";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * 更新 Hades 内核
   */
  async upgradeKernel(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upgrade",
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `更新失败 (HTTP ${response.status})`
        );
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "更新成功",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "更新过程中出错";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * 重启 Hades 内核
   */
  async restartKernel(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/restart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || `重启失败 (HTTP ${response.status})`
        );
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "重启成功",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "重启过程中出错";
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * 获取内核日志
   */
  async getKernelLogs(lines: number = 100): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/logs?lines=${lines}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      console.error("获取内核日志失败:", error);
      return [];
    }
  }

  /**
   * 检查内核更新
   */
  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/check-update`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("检查更新失败:", error);
      return {
        hasUpdate: false,
        currentVersion: "",
        latestVersion: "",
      };
    }
  }

  /**
   * 获取内核统计信息
   */
  async getKernelStats(): Promise<{
    uptime: number;
    connections: number;
    traffic: {
      up: number;
      down: number;
    };
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("获取内核统计信息失败:", error);
      return null;
    }
  }
}

// 导出单例
export const hadesKernelService = new HadesKernelService();
