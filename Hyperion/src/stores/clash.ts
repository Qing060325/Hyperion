import { createSignal, createEffect } from "solid-js";
import type { ClashConnectionConfig, ClashConfig, ClashVersion } from "../types/clash";

export function createClashStore() {
  const [connection, setConnection] = createSignal<ClashConnectionConfig>({
    host: "127.0.0.1",
    port: 9090,
    secret: "",
  });

  const [connected, setConnected] = createSignal(false);
  const [version, setVersion] = createSignal<ClashVersion | null>(null);
  const [config, setConfig] = createSignal<ClashConfig | null>(null);

  const baseUrl = () => {
    const conn = connection();
    return `http://${conn.host}:${conn.port}`;
  };

  const wsUrl = () => {
    const conn = connection();
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
