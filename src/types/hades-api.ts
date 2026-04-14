/**
 * Hades API TypeScript 类型定义
 * 基于 OpenAPI 3.0 规范自动生成
 * API 版本: 0.4.0
 */

// ============ 基础类型 ============

export interface VersionInfo {
  version: string;
  goVersion: string;
  buildTime: string;
}

export interface RuntimeConfig {
  mode: "rule" | "global" | "direct";
  logLevel: "silent" | "error" | "warning" | "info" | "debug";
  tun: {
    enable: boolean;
  };
}

// ============ 代理类型 ============

export type ProxyType =
  | "Shadowsocks"
  | "VMess"
  | "VLESS"
  | "Trojan"
  | "Hysteria2"
  | "TUIC"
  | "WireGuard"
  | "HTTP"
  | "SOCKS5"
  | "Direct"
  | "Reject";

export interface Proxy {
  name: string;
  type: ProxyType;
  addr: string;
  udp: boolean;
}

// ============ 代理组类型 ============

export type ProxyGroupType = "Selector" | "URLTest" | "Fallback" | "LoadBalance";

export interface ProxyGroup {
  name: string;
  type: ProxyGroupType;
  proxies: Proxy[];
  now?: string;
}

// ============ 规则类型 ============

export interface Rule {
  type: string;
  payload: string;
  proxy: string;
  size?: number;
}

// ============ 连接类型 ============

export interface ConnectionStat {
  id: string;
  start: string;
  host: string;
  download: number;
  upload: number;
  chains: string[];
  rule: string;
  process: string;
  uploadSpeed: number;
  downloadSpeed: number;
}

export interface ConnectionsInfo {
  connections: ConnectionStat[];
  downloadTotal: number;
  uploadTotal: number;
}

// ============ 流量类型 ============

export interface TrafficData {
  up: number;
  down: number;
}

// ============ DNS 类型 ============

export interface DNSQueryResult {
  name: string;
  ips: string[];
  error: string | null;
}

// ============ 订阅类型 ============

export interface SubscriptionInfo {
  name: string;
  url: string;
  updatedAt: string;
  proxyCount: number;
}

// ============ 升级类型 ============

export type UpgradeStatusType = "idle" | "downloading" | "installing" | "completed" | "failed";

export interface UpgradeStatus {
  status: UpgradeStatusType;
  message: string;
  progress: number;
}

export interface UpgradeResponse {
  message: string;
  current: string;
  latest: string;
  need_upgrade: boolean;
  status: string;
}

// ============ 日志类型 ============

export type LogLevel = "silent" | "error" | "warning" | "info" | "debug";

export interface LogEntry {
  type: string;
  payload: string;
}

// ============ API 响应包装 ============

export interface ProxiesResponse {
  proxies: Record<string, Proxy>;
}

export interface ProxyGroupsResponse {
  groups: Record<string, ProxyGroup>;
}

export interface RulesResponse {
  rules: Rule[];
}

export interface SubscriptionsResponse {
  subscriptions: SubscriptionInfo[];
}

export interface ConfigReloadResponse {
  message: string;
}
