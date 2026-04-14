import { createStore } from "solid-js/store";
import type { ClashConnectionConfig, ClashConfig, ClashVersion } from "../types/clash";

const STORAGE_KEY = "hyperion-connection";

export function createClashStore() {
  // 从 localStorage 加载连接配置
  const loadSavedConnection = (): ClashConnectionConfig => {
    const defaults: ClashConnectionConfig = {
      host: window.location.hostname,
      port: parseInt(window.location.port) || 80,
      secret: "",
      useProxy: true,
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return defaults;
  };

  // 使用 Solid Store（响应式 + 不可变读取）
  const [store, setStore] = createStore({
    connection: loadSavedConnection(),
    connected: false,
    version: null as ClashVersion | null,
    config: null as ClashConfig | null,
  });

  // 持久化连接设置
  const persistConnection = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.connection));
    } catch {
      // 忽略存储错误
    }
  };

  // 兼容旧 API 的 getter（像 signal 一样调用）
  const connection = () => store.connection;
  const connected = () => store.connected;
  const version = () => store.version;
  const config = () => store.config;

  const baseUrl = () => {
    const conn = store.connection;
    if (conn.useProxy) {
      return `${window.location.origin}/api`;
    }
    return `http://${conn.host}:${conn.port}`;
  };

  const wsUrl = () => {
    const conn = store.connection;
    if (conn.useProxy) {
      return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;
    }
    return `ws://${conn.host}:${conn.port}`;
  };

  const token = () => store.connection.secret || "";

  const headers = () => ({
    "Content-Type": "application/json",
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
  });

  const setConnection = (updates: Partial<ClashConnectionConfig> | ((prev: ClashConnectionConfig) => Partial<ClashConnectionConfig>)) => {
    if (typeof updates === "function") {
      setStore("connection", (prev) => ({ ...prev, ...updates(prev) }));
    } else {
      setStore("connection", updates);
    }
  };

  const setConnected = (v: boolean) => setStore("connected", v);
  const setVersion = (v: ClashVersion | null) => setStore("version", v);
  const setConfig = (v: ClashConfig | null) => setStore("config", v);

  const connect = async () => {
    try {
      const res = await fetch(`${baseUrl()}/version`, {
        headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setStore({ version: data, connected: true });

        const configRes = await fetch(`${baseUrl()}/configs`, {
          headers: headers(),
        });
        if (configRes.ok) {
          setStore("config", await configRes.json());
        }
        return true;
      }
      setStore("connected", false);
      return false;
    } catch (e) {
      console.error(e);
      setStore("connected", false);
      return false;
    }
  };

  const updateConnection = async (updates: Partial<ClashConnectionConfig>) => {
    setStore("connection", updates);
    persistConnection();
    setStore("connected", false);
    return await connect();
  };

  return {
    // 保持与旧 API 完全兼容的 signal 风格 getter
    connection,
    setConnection,
    connected,
    setConnected,
    version,
    setVersion,
    config,
    setConfig,
    // 计算属性
    baseUrl,
    wsUrl,
    token,
    headers,
    // 操作
    connect,
    updateConnection,
    // 暴露底层 store 供高级用法
    store,
  };
}

let _clashStore: ReturnType<typeof createClashStore> | null = null;

export function useClashStore() {
  if (!_clashStore) {
    _clashStore = createClashStore();
  }
  return _clashStore;
}
