import { createStore } from "solid-js/store";
import type { HyperionSettings } from "../types/clash";
import { DEFAULT_SETTINGS } from "../types/clash";

const STORAGE_KEY = "hyperion-settings";

export function createSettingsStore() {
  // 从 localStorage 加载
  const loadSaved = (): HyperionSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // 忽略解析错误
    }
    return { ...DEFAULT_SETTINGS };
  };

  const [store, setStore] = createStore<HyperionSettings>(loadSaved());

  // 自动持久化
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // 忽略存储错误
    }
  };

  const settings = () => store;
  const setSettings = (v: HyperionSettings) => {
    setStore(v);
    persist();
  };

  const updateSettings = (partial: Partial<HyperionSettings>) => {
    setStore(partial);
    persist();
  };

  const loadSettings = () => {
    setStore(loadSaved());
  };

  const saveSettings = () => {
    persist();
  };

  return {
    settings,
    setSettings,
    updateSettings,
    loadSettings,
    saveSettings,
    store,
  };
}

let _settingsStore: ReturnType<typeof createSettingsStore> | null = null;

export function useSettingsStore() {
  if (!_settingsStore) {
    _settingsStore = createSettingsStore();
  }
  return _settingsStore;
}
