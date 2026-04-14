// ==========================================
// Hotkey Type Definitions
// ==========================================

/** Hotkey action type */
export type HotkeyAction =
  | 'toggle-proxy'
  | 'switch-mode-rule'
  | 'switch-mode-global'
  | 'switch-mode-direct'
  | 'toggle-tun'
  | 'open-settings'
  | 'show-connections'
  | 'show-proxies'
  | 'reload-config'
  | 'test-delay'
  | 'clear-connections'
  | 'toggle-dashboard'
  | 'custom';

/** Hotkey binding */
export interface HotkeyBinding {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: HotkeyAction;
  actionLabel: string;
  enabled: boolean;
  description: string;
}

/** Tray configuration */
export interface TrayConfig {
  enabled: boolean;
  show_traffic: boolean;
  show_connections: boolean;
  show_current_proxy: boolean;
  minimize_to_tray: boolean;
  close_to_tray: boolean;
  start_minimized: boolean;
}

/** Notification configuration */
export interface NotificationConfig {
  enabled: boolean;
  connection_error: boolean;
  subscription_expire: boolean;
  proxy_change: boolean;
  new_version: boolean;
  sound: boolean;
}

/** Default hotkey bindings */
export const DEFAULT_HOTKEYS: HotkeyBinding[] = [
  { id: 'hk-1', key: 'P', modifiers: ['ctrl', 'shift'], action: 'toggle-proxy', actionLabel: '切换代理', enabled: true, description: '开启/关闭系统代理' },
  { id: 'hk-2', key: 'R', modifiers: ['ctrl', 'shift'], action: 'switch-mode-rule', actionLabel: '规则模式', enabled: true, description: '切换到规则模式' },
  { id: 'hk-3', key: 'G', modifiers: ['ctrl', 'shift'], action: 'switch-mode-global', actionLabel: '全局模式', enabled: true, description: '切换到全局模式' },
  { id: 'hk-4', key: 'D', modifiers: ['ctrl', 'shift'], action: 'switch-mode-direct', actionLabel: '直连模式', enabled: true, description: '切换到直连模式' },
  { id: 'hk-5', key: 'T', modifiers: ['ctrl', 'shift'], action: 'toggle-tun', actionLabel: 'TUN 模式', enabled: true, description: '开启/关闭 TUN 模式' },
  { id: 'hk-6', key: 'S', modifiers: ['ctrl', 'shift'], action: 'open-settings', actionLabel: '打开设置', enabled: true, description: '打开设置页面' },
  { id: 'hk-7', key: 'C', modifiers: ['ctrl', 'shift'], action: 'show-connections', actionLabel: '显示连接', enabled: true, description: '显示连接管理' },
  { id: 'hk-8', key: 'R', modifiers: ['ctrl', 'alt'], action: 'reload-config', actionLabel: '重载配置', enabled: true, description: '重新加载配置文件' },
];

/** Default tray config */
export const DEFAULT_TRAY_CONFIG: TrayConfig = {
  enabled: true,
  show_traffic: true,
  show_connections: true,
  show_current_proxy: true,
  minimize_to_tray: true,
  close_to_tray: true,
  start_minimized: false,
};

/** Default notification config */
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  connection_error: true,
  subscription_expire: true,
  proxy_change: false,
  new_version: true,
  sound: false,
};
