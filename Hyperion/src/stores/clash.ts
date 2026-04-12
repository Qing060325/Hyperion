import { createSignal, createEffect } from "solid-js";
import type { ClashConnectionConfig, ClashConfig, ClashVersion } from "../types/clash";

export function createClashStore() {
  const [connection, setConnection] = createSignal<ClashConnectionConfig>({
    host: window.location.hostname,
    port: parseInt(window.location.port) || 80,
    secret: "",
    useProxy: true,
  });

  const [connected, setConnected] = createSignal(false);
  const [version, setVersion] = createSignal<ClashVersion | null>(null);
  const [config, setConfig] = createSignal<ClashConfig | null>(null);

  const baseUrl = () => {
    const conn = connection();
    // 当 useProxy 为 true 时，通过 nginx 反代访问 Clash API
    if (conn.useProxy) {
      return `${window.location.origin}/api`;
    }
    return `http://${conn.host}:${conn.port}`;
  };

  const wsUrl = () => {
    const conn = connection();
    if (conn.useProxy) {
      return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;
    }
    return `ws://${conn.host}:${conn.port}`;
  };

  const token = () => connection().secret || "";

  const headers = () => ({
    "Content-Type": "application/json",
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
  });

  const connect = async () => {
    try {
      const res = await fetch(`${baseUrl()}/version`, {
        headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setVersion(data);
        setConnected(true);

        // Also fetch config
        const configRes = await fetch(`${baseUrl()}/configs`, {
          headers: headers(),
        });
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }
        return true;
      }
      setConnected(false);
      return false;
    } catch {
      setConnected(false);
      return false;
    }
  };

  return {
    connection,
    setConnection,
    connected,
    setConnected,
    version,
    setVersion,
    config,
    setConfig,
    baseUrl,
    wsUrl,
    token,
    headers,
    connect,
  };
}

// Singleton store
let _clashStore: ReturnType<typeof createClashStore> | null = null;

export function useClashStore() {
  if (!_clashStore) {
    _clashStore = createClashStore();
  }
  return _clashStore;
}
