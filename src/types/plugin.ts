// ==========================================
// Plugin System Type Definitions
// ==========================================

/** Plugin route */
export interface PluginRoute {
  path: string;
  component: string;
  name: string;
  icon?: string;
  order?: number;
}

/** Plugin component */
export interface PluginComponent {
  id: string;
  type: 'panel' | 'widget' | 'setting' | 'menu';
  position: 'dashboard' | 'sidebar' | 'settings' | 'navbar';
  component: string;
  order?: number;
}

/** Plugin setting */
export interface PluginSetting {
  key: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color';
  label: string;
  description?: string;
  default: string | number | boolean;
  options?: { label: string; value: string | number }[];
  min?: number;
  max?: number;
}

/** Plugin event */
export type PluginEvent =
  | 'on-load'
  | 'on-unload'
  | 'on-config-change'
  | 'on-proxy-change'
  | 'on-connection-open'
  | 'on-connection-close'
  | 'on-mode-change'
  | 'on-error';

/** Plugin manifest */
export interface HyperionPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  enabled: boolean;
  minHyperionVersion?: string;
  maxHyperionVersion?: string;
  
  /** Lifecycle hooks */
  onLoad?: (api: PluginAPI) => Promise<void>;
  onUnload?: () => Promise<void>;
  onConfigChange?: (config: Record<string, unknown>) => void;
  
  /** Extension capabilities */
  routes?: PluginRoute[];
  components?: PluginComponent[];
  settings?: PluginSetting[];
  
  /** Dependencies */
  dependencies?: Record<string, string>;
}

/** Plugin API interface */
export interface PluginAPI {
  /** State access */
  getStore: () => Record<string, unknown>;
  getSettings: () => Record<string, unknown>;
  getTheme: () => Record<string, unknown>;
  
  /** API calls */
  callApi: <T>(method: string, path: string, body?: Record<string, unknown>) => Promise<T>;
  
  /** UI extension */
  addNavItem: (item: NavItem) => void;
  removeNavItem: (id: string) => void;
  addSettingSection: (section: SettingSection) => void;
  removeSettingSection: (id: string) => void;
  
  /** Event subscription */
  on: (event: PluginEvent, handler: (...args: unknown[]) => void) => void;
  off: (event: PluginEvent, handler: (...args: unknown[]) => void) => void;
  emit: (event: PluginEvent, data?: unknown) => void;
  
  /** Notifications */
  showNotification: (title: string, body: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  
  /** Storage */
  getStorage: (key: string) => string | null;
  setStorage: (key: string, value: string) => void;
}

/** Navigation item for plugin */
export interface NavItem {
  id: string;
  path: string;
  label: string;
  icon?: string;
  badge?: string | number;
  order?: number;
}

/** Setting section for plugin */
export interface SettingSection {
  id: string;
  title: string;
  icon?: string;
  order?: number;
  render: () => any;
}

/** Plugin state */
export interface PluginState {
  plugins: Map<string, HyperionPlugin>;
  loaded: boolean;
  loading: boolean;
  error?: string;
}
