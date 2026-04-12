import { createSignal } from "solid-js";
import type { HyperionSettings } from "../types/clash";
import { DEFAULT_SETTINGS } from "../types/clash";

export function createSettingsStore() {
  const [settings, setSettings] = createSignal<HyperionSettings>({
    ...DEFAULT_SETTINGS,
  });

  const updateSettings = (partial: Partial<HyperionSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem("hyperion-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore parse errors
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("hyperion-settings", JSON.stringify(settings()));
    } catch {
      // Ignore storage errors
    }
  };

  return {
    settings,
    setSettings,
    updateSettings,
    loadSettings,
    saveSettings,
  };
}

let _settingsStore: ReturnType<typeof createSettingsStore> | null = null;

export function useSettingsStore() {
  if (!_settingsStore) {
    _settingsStore = createSettingsStore();
  }
  return _settingsStore;
}
