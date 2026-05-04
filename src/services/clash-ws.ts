// ==========================================
// WebSocket Manager for Clash
// ==========================================

import { useClashStore } from "../stores/clash";
import { useScenicModeStore } from "../stores/scenicMode";
import type { TrafficData, LogEntry, ConnectionsData } from "../types/clash";

type TrafficCallback = (data: TrafficData) => void;
type LogCallback = (entry: LogEntry) => void;
type ConnectionsCallback = (data: ConnectionsData) => void;

export type WsState = "connecting" | "connected" | "disconnected" | "error";

export class ClashWebSocketManager {
  private trafficWs: WebSocket | null = null;
  private logsWs: WebSocket | null = null;
  private connectionsWs: WebSocket | null = null;

  private trafficCallback: TrafficCallback | null = null;
  private logsCallback: LogCallback | null = null;
  private connectionsCallback: ConnectionsCallback | null = null;

  // 连接状态
  private _trafficState: WsState = "disconnected";
  private _logsState: WsState = "disconnected";
  private _connectionsState: WsState = "disconnected";
  private stateListeners: Set<() => void> = new Set();

  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;

  // 状态访问器
  get trafficState(): WsState { return this._trafficState; }
  get logsState(): WsState { return this._logsState; }
  get connectionsState(): WsState { return this._connectionsState; }

  onStateChange(listener: () => void) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(type: "traffic" | "logs" | "connections", state: WsState) {
    const key = `_${type}State` as `_${typeof type}State`;
    if (this[key] === state) return;
    (this as any)[key] = state;
    this.stateListeners.forEach((fn) => fn());
  }

  private buildWsUrl(path: string, params?: string): string {
    const store = useClashStore();
    const token = store.token();
    let url = `${store.wsUrl()}${path}`;
    const allParams = new URLSearchParams();
    if (token) allParams.set("token", token);
    if (params) {
      const p = new URLSearchParams(params);
      for (const [key, value] of p) allParams.set(key, value);
    }
    const qs = allParams.toString();
    if (qs) url += `?${qs}`;
    return url;
  }


  private extractPrimaryNode(data: ConnectionsData): string | null {
    const counts = new Map<string, number>();
    for (const conn of data.connections || []) {
      const chain = conn.chains || [];
      const terminal = chain[chain.length - 1]?.trim();
      if (!terminal) continue;
      counts.set(terminal, (counts.get(terminal) || 0) + 1);
    }

    let best: string | null = null;
    let bestCount = 0;
    for (const [node, count] of counts) {
      if (count > bestCount) {
        best = node;
        bestCount = count;
      }
    }
    return best;
  }

  // === Traffic ===
  connectTraffic(callback: TrafficCallback) {
    this.trafficCallback = callback;
    this.createConnection(
      "/traffic",
      (ws) => (this.trafficWs = ws),
      (data) => {
        try {
          this.trafficCallback?.(JSON.parse(data));
        } catch { /* ignore parse errors */ }
      },
      "traffic",
    );
  }

  // === Logs ===
  connectLogs(level: string, callback: LogCallback) {
    this.logsCallback = callback;
    this.createConnection(
      `/logs?level=${level}`,
      (ws) => (this.logsWs = ws),
      (data) => {
        try {
          this.logsCallback?.(JSON.parse(data));
        } catch { /* ignore parse errors */ }
      },
      "logs",
    );
  }

  // === Connections ===
  connectConnections(callback: ConnectionsCallback) {
    this.connectionsCallback = callback;
    this.createConnection(
      "/connections",
      (ws) => (this.connectionsWs = ws),
      (data) => {
        try {
          const parsed = JSON.parse(data) as ConnectionsData;
          this.connectionsCallback?.(parsed);

          const primaryNode = this.extractPrimaryNode(parsed);
          useScenicModeStore().observeNode(primaryNode);
        } catch { /* ignore parse errors */ }
      },
      "connections",
    );
  }

  private createConnection(
    path: string,
    setWs: (ws: WebSocket) => void,
    onMessage: (data: string) => void,
    type: "traffic" | "logs" | "connections",
  ) {
    const url = this.buildWsUrl(path);
    const reconnectKey = `reconnect_${type}`;

    // 清除旧的重连定时器
    const existingTimer = this.reconnectTimers.get(reconnectKey);
    if (existingTimer) clearTimeout(existingTimer);

    try {
      this.setState(type, "connecting");
      const ws = new WebSocket(url);
      setWs(ws);

      ws.onopen = () => {
        this.setState(type, "connected");
        if (type === "connections") {
          useScenicModeStore().setFrozen(false);
        }
      };

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          onMessage(event.data);
        }
      };

      ws.onclose = () => {
        this.setState(type, "disconnected");
        if (type === "connections") {
          useScenicModeStore().setFrozen(true);
        }
        this.handleReconnect(path, setWs, onMessage, type, 0);
      };

      ws.onerror = () => {
        this.setState(type, "error");
        ws.close();
      };
    } catch (e) {
      this.setState(type, "error");
      console.error("WebSocket connection failed:", e);
    }
  }

  private handleReconnect(
    path: string,
    setWs: (ws: WebSocket) => void,
    onMessage: (data: string) => void,
    type: "traffic" | "logs" | "connections",
    attempt: number,
  ) {
    if (attempt >= this.maxReconnectAttempts) {
      console.warn(`WebSocket ${type}: 达到最大重连次数 ${this.maxReconnectAttempts}`);
      return;
    }

    // 指数退避: 1s, 2s, 4s, 8s, 16s, 30s (封顶)
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), 30000);
    const reconnectKey = `reconnect_${type}`;

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(reconnectKey);
      if (useClashStore().connected()) {
        this.createConnection(path, setWs, onMessage, type);
      }
    }, delay);

    this.reconnectTimers.set(reconnectKey, timer);
  }

  disconnectAll() {
    // 清除所有重连定时器
    this.reconnectTimers.forEach((timer) => clearTimeout(timer));
    this.reconnectTimers.clear();

    this.trafficWs?.close();
    this.logsWs?.close();
    this.connectionsWs?.close();
    this.trafficWs = null;
    this.logsWs = null;
    this.connectionsWs = null;

    this._trafficState = "disconnected";
    this._logsState = "disconnected";
    this._connectionsState = "disconnected";
    useScenicModeStore().setFrozen(true);
    this.stateListeners.forEach((fn) => fn());
  }

  disconnectTraffic() {
    const timer = this.reconnectTimers.get("reconnect_traffic");
    if (timer) { clearTimeout(timer); this.reconnectTimers.delete("reconnect_traffic"); }
    this.trafficWs?.close();
    this.trafficWs = null;
    this._trafficState = "disconnected";
    this.stateListeners.forEach((fn) => fn());
  }

  disconnectLogs() {
    const timer = this.reconnectTimers.get("reconnect_logs");
    if (timer) { clearTimeout(timer); this.reconnectTimers.delete("reconnect_logs"); }
    this.logsWs?.close();
    this.logsWs = null;
    this._logsState = "disconnected";
    this.stateListeners.forEach((fn) => fn());
  }

  disconnectConnections() {
    const timer = this.reconnectTimers.get("reconnect_connections");
    if (timer) { clearTimeout(timer); this.reconnectTimers.delete("reconnect_connections"); }
    this.connectionsWs?.close();
    this.connectionsWs = null;
    this._connectionsState = "disconnected";
    useScenicModeStore().setFrozen(true);
    this.stateListeners.forEach((fn) => fn());
  }
}

// Singleton
let _wsManager: ClashWebSocketManager | null = null;

export function useClashWs(): ClashWebSocketManager {
  if (!_wsManager) {
    _wsManager = new ClashWebSocketManager();
  }
  return _wsManager;
}
