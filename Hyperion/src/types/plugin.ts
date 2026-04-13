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
  default: any;
  options?: { label: string; value: any }[];
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
  onConfigChange?: (config: any) => void;
  
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
  getStore: () => any;
  getSettings: () => any;
  getTheme: () => any;
  
  /** API calls */
  callApi: <T>(method: string, path: string, body?: any) => Promise<T>;
  
  /** UI extension */
  addNavItem: (item: NavItem) => void;
  removeNavItem: (id: string) => void;
  addSettingSection: (section: SettingSection) => void;
  removeSettingSection: (id: string) => void;
  
  /** Event subscription */
  on: (event: PluginEvent, handler: Function) => void;
  off: (event: PluginEvent, handler: Function) => void;
  emit: (event: PluginEvent, data?: any) => void;
  
  /** Notifications */
  showNotification: (title: string, body: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  
  /** Storage */
  getStorage: (key: string) => any;
  setStorage: (key: string, value: any) => void;
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
