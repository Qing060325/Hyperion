// ==========================================
// Clash API Type Definitions
// ==========================================

/** Clash/Hades core version info */
export interface ClashVersion {
  meta?: boolean;
  version: string;
  goVersion?: string;
  buildTime?: string;
}

/** Clash basic config */
export interface ClashConfig {
  port?: number;
  socks_port?: number;
  redir_port?: number;
  tproxy_port?: number;
  mixed_port?: number;
  allow_lan?: boolean;
  bind_address?: string;
  mode: "rule" | "global" | "direct";
  log_level?: string;
  ipv6?: boolean;
  external_controller?: string;
  secret?: string;
  tun?: TunConfig;
}

export interface TunConfig {
  enable: boolean;
  stack?: string;
  dns_hijack?: string[];
  auto_route?: boolean;
  auto_detect_interface?: boolean;
}

// ==========================================
// Proxy Types
// ==========================================

export interface ProxyMap {
  [key: string]: ProxyInfo;
}

export interface ProxyInfo {
  name: string;
  type: ProxyType;
  udp?: boolean;
  xudp?: boolean;
  history?: DelayHistory[];
  all?: string[];
  now?: string;
  alive?: boolean;
  delay?: number;
  icon?: string;
}

export type ProxyType =
  | "Shadowsocks"
  | "ShadowsocksR"
  | "VMess"
  | "Trojan"
  | "VLESS"
  | "Hysteria"
  | "Hysteria2"
  | "TUIC"
  | "WireGuard"
  | "HTTP"
  | "HTTPS"
  | "SOCKS5"
  | "Selector"
  | "URLTest"
  | "Fallback"
  | "LoadBalance"
  | "Relay"
  | "Direct"
  | "Reject"
  | "Compatible";

export interface DelayHistory {
  time: string;
  delay: number;
}

export interface DelayResult {
  delay: number;
  message?: string;
}

// ==========================================
// Rule Types
// ==========================================

export interface RulesData {
  rules: RuleInfo[];
}

export interface RuleInfo {
  type: string;
  payload: string;
  proxy: string;
}

// ==========================================
// Connection Types
// ==========================================

export interface ConnectionsData {
  download_total: number;
  upload_total: number;
  connections: ConnectionInfo[];
  memory?: number;
}

export interface ConnectionInfo {
  id: string;
  metadata: ConnectionMetadata;
  upload: number;
  download: number;
  rule: string;
  rule_payload: string;
  chains: string[];
  start: string;
  curUpload?: number;
  curDownload?: number;
}

export interface ConnectionMetadata {
  network?: string;
  type?: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: string;
  destination_port?: string;
  host?: string;
  dns_mode?: string;
  uid?: number;
  process?: string;
  process_path?: string;
  remote_destination?: string;
  sniff_host?: string;
}

// ==========================================
// Traffic & Log Types
// ==========================================

export interface TrafficData {
  up: number;
  down: number;
}

export interface LogEntry {
  type: "debug" | "info" | "warning" | "error";
  payload: string;
}

// ==========================================
// Provider Types
// ==========================================

export interface ProxyProviders {
  [key: string]: ProxyProvider;
}

export interface ProxyProvider {
  name: string;
  type: string;
  vehicle_type: string;
  proxies: ProxyInfo[];
  updatedAt: string;
  subscriptionInfo?: SubscriptionInfo;
}

export interface SubscriptionInfo {
  Upload: number;
  Download: number;
  Total: number;
  Expire: number;
}

export interface RuleProviders {
  [key: string]: RuleProvider;
}

export interface RuleProvider {
  name: string;
  type: string;
  vehicle_type: string;
  behavior: string;
  rule_count: number;
  updatedAt: string;
}

// ==========================================
// DNS Types
// ==========================================

export interface DNSQueryResult {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: DNSQuestion[];
  Answer: DNSAnswer[];
}

export interface DNSQuestion {
  name: string;
  type: number;
}

export interface DNSAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

// ==========================================
// Connection Config Types
// ==========================================

export interface ClashConnectionConfig {
  host: string;
  port: number;
  secret?: string;
  useProxy?: boolean;
}

// ==========================================
// Hyperion App Settings
// ==========================================

export interface HyperionSettings {
  theme: "light" | "dark" | "system";
  language: "zh-CN" | "en";
  auto_start: boolean;
  silent_start: boolean;
  minimize_to_tray: boolean;
  proxy_log_level: string;
  log_max_files: number;
  proxy_guard: boolean;
  // v0.3.0 新增
  wizard_completed: boolean;
  first_run: boolean;
  auto_detect_clash: boolean;
  // v0.4.0 新增
  sakura_skin: boolean;
}

export const DEFAULT_SETTINGS: HyperionSettings = {
  theme: "dark",
  language: "zh-CN",
  auto_start: false,
  silent_start: false,
  minimize_to_tray: true,
  proxy_log_level: "info",
  log_max_files: 10,
  proxy_guard: false,
  // v0.3.0 新增
  wizard_completed: false,
  first_run: true,
  auto_detect_clash: true,
  // v0.4.0 新增
  sakura_skin: false,
};

// ==========================================
// Profile Types (v0.3.0)
// ==========================================

export interface Profile {
  id: string;
  name: string;
  path: string;
  type: 'local' | 'remote';
  url?: string;
  lastModified: string;
  size: number;
  active: boolean;
}

// ==========================================
// Detection Types (v0.3.0)
// ==========================================

export interface ClashDetectionResult {
  found: boolean;
  path?: string;
  version?: string;
  meta?: boolean;
  error?: string;
}

// ==========================================
// Network Types (v0.3.0)
// ==========================================

export interface SystemProxyConfig {
  enabled: boolean;
  http: string;
  https: string;
  socks: string;
  bypass: string[];
}

// ==========================================
// Proxy Group Types (v0.3.0)
// ==========================================

export interface ProxyGroupOrder {
  name: string;
  proxies: string[];
}
