import { createStore } from "solid-js/store";
import type { HyperionSettings } from "../types/clash";
import { DEFAULT_SETTINGS } from "../types/clash";
import { logger, logEmoji } from "../utils/logger";

const STORAGE_KEY = "hyperion-settings";

export function createSettingsStore() {
  const loadSaved = (): HyperionSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        logger.log(`${logEmoji.settings} Loaded saved settings`);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      logger.error(`${logEmoji.error} Failed to load settings:`, e);
    }
    logger.log(`${logEmoji.info} Using default settings`);
    return { ...DEFAULT_SETTINGS };
  };

  const [store, setStore] = createStore<HyperionSettings>(loadSaved());

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      logger.debug(`${logEmoji.settings} Settings saved successfully`);
    } catch (e) {
      logger.error(`${logEmoji.error} Failed to save settings:`, e);
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
