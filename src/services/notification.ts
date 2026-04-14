// ==========================================
// Notification Service - System Notifications
// ==========================================

import type { NotificationConfig } from '../types/hotkey';
import { DEFAULT_NOTIFICATION_CONFIG } from '../types/hotkey';

class NotificationService {
  private config: NotificationConfig;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.config = { ...DEFAULT_NOTIFICATION_CONFIG };
    this.loadConfig();
    this.checkPermission();
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Check current permission
   */
  async checkPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Show notification
   */
  async show(title: string, body: string, options?: NotificationOptions): Promise<void> {
    if (!this.config.enabled) return;
    
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icons/favicon.svg',
        badge: '/icons/favicon.svg',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Show connection error notification
   */
  showConnectionError(message: string): void {
    if (this.config.connection_error) {
      this.show('连接错误', message);
    }
  }

  /**
   * Show subscription expiring notification
   */
  showSubscriptionExpiring(days: number): void {
    if (this.config.subscription_expire) {
      this.show('订阅即将到期', `您的订阅将在 ${days} 天后到期，请及时续费。`);
    }
  }

  /**
   * Show proxy change notification
   */
  showProxyChange(proxy: string): void {
    if (this.config.proxy_change) {
      this.show('代理已切换', `当前代理: ${proxy}`);
    }
  }

  /**
   * Show new version notification
   */
  showNewVersion(version: string): void {
    if (this.config.new_version) {
      this.show('发现新版本', `Hyperion ${version} 已发布，点击查看更新日志。`);
    }
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  /**
   * Get current config
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Save config to storage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('hyperion-notifications', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save notification config:', error);
    }
  }

  /**
   * Load config from storage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('hyperion-notifications');
      if (saved) {
        this.config = { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Use defaults
    }
  }
}

export const notificationService = new NotificationService();
