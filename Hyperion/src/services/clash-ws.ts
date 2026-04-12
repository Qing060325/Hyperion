// ==========================================
// WebSocket Manager for Clash
// ==========================================

import { useClashStore } from "../stores/clash";
import type { TrafficData, LogEntry, ConnectionsData } from "../types/clash";

type TrafficCallback = (data: TrafficData) => void;
type LogCallback = (entry: LogEntry) => void;
type ConnectionsCallback = (data: ConnectionsData) => void;

export class ClashWebSocketManager {
  private trafficWs: WebSocket | null = null;
  private logsWs: WebSocket | null = null;
  private connectionsWs: WebSocket | null = null;

  private trafficCallback: TrafficCallback | null = null;
  private logsCallback: LogCallback | null = null;
  private connectionsCallback: ConnectionsCallback | null = null;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

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
      }
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
      }
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
          this.connectionsCallback?.(JSON.parse(data));
        } catch { /* ignore parse errors */ }
      }
    );
  }

  private createConnection(
    path: string,
    setWs: (ws: WebSocket) => void,
    onMessage: (data: string) => void
  ) {
    const url = this.buildWsUrl(path);

    try {
      const ws = new WebSocket(url);
      setWs(ws);

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          onMessage(event.data);
        }
      };

      ws.onclose = () => {
        this.handleReconnect(path, setWs, onMessage);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.error("WebSocket connection failed:", e);
    }
  }

  private handleReconnect(
    path: string,
    setWs: (ws: WebSocket) => void,
    onMessage: (data: string) => void
  ) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    setTimeout(() => {
      if (useClashStore().connected()) {
        this.createConnection(path, setWs, onMessage);
      }
    }, delay);
  }

  disconnectAll() {
    this.trafficWs?.close();
    this.logsWs?.close();
    this.connectionsWs?.close();
    this.trafficWs = null;
    this.logsWs = null;
    this.connectionsWs = null;
  }

  disconnectTraffic() {
    this.trafficWs?.close();
    this.trafficWs = null;
  }

  disconnectLogs() {
    this.logsWs?.close();
    this.logsWs = null;
  }

  disconnectConnections() {
    this.connectionsWs?.close();
    this.connectionsWs = null;
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
