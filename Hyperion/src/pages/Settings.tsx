import { createSignal, onMount, For, Show } from "solid-js";
import { useClashStore } from "../stores/clash";
import { useThemeStore } from "../stores/theme";
import { useSettingsStore } from "../stores/settings";
import { useI18n } from "../i18n";
import { clashApi } from "../services/clash-api";
import type { ClashConnectionConfig } from "../types/clash";

export default function Settings() {
  const { t, locale, setLocale } = useI18n();
  const clash = useClashStore();
  const theme = useThemeStore();
  const settings = useSettingsStore();

  const [activeSection, setActiveSection] = createSignal("general");
  const [host, setHost] = createSignal(clash.connection().host);
  const [port, setPort] = createSignal(String(clash.connection().port));
  const [secret, setSecret] = createSignal(clash.connection().secret || "");

  const sections = [
    { key: "general", label: "General" },
    { key: "connection", label: "Connection" },
    { key: "appearance", label: "Appearance" },
    { key: "network", label: "Network" },
    { key: "about", label: "About" },
  ];

  const saveConnection = async () => {
    const conn: ClashConnectionConfig = {
      host: host(),
      port: parseInt(port()) || 9090,
      secret: secret() || undefined,
    };
    clash.setConnection(conn);
    await clash.connect();
  };

  const patchConfig = async (data: Record<string, unknown>) => {
    try {
      await clashApi.patchConfig(data as any);
      // Refresh config
      const config = await clashApi.getConfig();
      clash.setConfig(config);
    } catch (e) {
      console.error("Failed to patch config:", e);
    }
  };

  return (
    <div class="flex gap-4 h-full overflow-hidden">
      {/* Section Sidebar */}
      <div
        class="w-48 flex-shrink-0 rounded-xl py-2"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <For each={sections}>
          {(section) => (
            <button
              class="w-full px-4 py-2 text-left text-xs font-medium transition-all duration-200"
              style={{
                color: activeSection() === section.key ? "var(--accent)" : "var(--text-secondary)",
                background: activeSection() === section.key ? "var(--accent-muted)" : "transparent",
                "border-left": activeSection() === section.key
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              }}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          )}
        </For>
      </div>

      {/* Settings Content */}
      <div class="flex-1 overflow-y-auto">
        {/* General */}
        <Show when={activeSection() === "general"}>
          <SettingsSection title="General">
            <SettingRow label="Language">
              <select
                class="px-3 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                value={locale()}
                onChange={(e) => setLocale(e.currentTarget.value as "zh-CN" | "en")}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </SettingRow>
            <SettingRow label="Auto Start">
              <ToggleSwitch
                value={settings.settings().auto_start}
                onChange={(v) => {
                  settings.updateSettings({ auto_start: v });
                  settings.saveSettings();
                }}
              />
            </SettingRow>
            <SettingRow label="Silent Start">
              <ToggleSwitch
                value={settings.settings().silent_start}
                onChange={(v) => {
                  settings.updateSettings({ silent_start: v });
                  settings.saveSettings();
                }}
              />
            </SettingRow>
            <SettingRow label="Minimize to Tray">
              <ToggleSwitch
                value={settings.settings().minimize_to_tray}
                onChange={(v) => {
                  settings.updateSettings({ minimize_to_tray: v });
                  settings.saveSettings();
                }}
              />
            </SettingRow>
          </SettingsSection>
        </Show>

        {/* Connection */}
        <Show when={activeSection() === "connection"}>
          <SettingsSection title="Clash API Connection">
            <SettingRow label="API Host">
              <input
                class="px-3 py-1.5 rounded-lg text-xs outline-none font-mono w-48"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                value={host()}
                onInput={(e) => setHost(e.currentTarget.value)}
              />
            </SettingRow>
            <SettingRow label="API Port">
              <input
                class="px-3 py-1.5 rounded-lg text-xs outline-none font-mono w-48"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                type="number"
                value={port()}
                onInput={(e) => setPort(e.currentTarget.value)}
              />
            </SettingRow>
            <SettingRow label="API Secret">
              <input
                class="px-3 py-1.5 rounded-lg text-xs outline-none font-mono w-48"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                type="password"
                placeholder="Optional"
                value={secret()}
                onInput={(e) => setSecret(e.currentTarget.value)}
              />
            </SettingRow>
            <div class="flex justify-end mt-4">
              <button
                class="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  border: "1px solid rgba(6,182,212,0.3)",
                }}
                onClick={saveConnection}
              >
                Connect
              </button>
            </div>
            <div class="mt-3 p-3 rounded-lg" style={{
              background: clash.connected() ? "var(--success-muted)" : "var(--error-muted)",
              border: `1px solid ${clash.connected() ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" style={{
                  background: clash.connected() ? "var(--success)" : "var(--error)",
                }} />
                <span class="text-xs" style={{
                  color: clash.connected() ? "var(--success)" : "var(--error)",
                }}>
                  {clash.connected()
                    ? `Connected — Clash Meta v${clash.version()?.version || "unknown"}`
                    : "Disconnected"}
                </span>
              </div>
            </div>
          </SettingsSection>
        </Show>

        {/* Appearance */}
        <Show when={activeSection() === "appearance"}>
          <SettingsSection title="Appearance">
            <SettingRow label="Theme">
              <div class="flex gap-2">
                {(["dark", "light", "system"] as const).map((t) => (
                  <button
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: theme.theme() === t ? "var(--accent-muted)" : "var(--bg-tertiary)",
                      color: theme.theme() === t ? "var(--accent)" : "var(--text-secondary)",
                      border: theme.theme() === t ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent",
                    }}
                    onClick={() => theme.setTheme(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </SettingRow>
          </SettingsSection>
        </Show>

        {/* Network */}
        <Show when={activeSection() === "network"}>
          <SettingsSection title="Network Settings">
            <SettingRow label="System Proxy">
              <ToggleSwitch
                value={true} // placeholder
                onChange={() => {}}
              />
            </SettingRow>
            <SettingRow label="TUN Mode">
              <ToggleSwitch
                value={clash.config()?.tun?.enable || false}
                onChange={async (v) => {
                  await patchConfig({
                    tun: {
                      enable: v,
                      stack: "gvisor",
                      "auto-route": true,
                      "auto-detect-interface": true,
                    },
                  });
                }}
              />
            </SettingRow>
            <SettingRow label="Allow LAN">
              <ToggleSwitch
                value={clash.config()?.allow_lan || false}
                onChange={async (v) => {
                  await patchConfig({ "allow-lan": v });
                }}
              />
            </SettingRow>
            <SettingRow label="Mode">
              <div class="flex gap-2">
                {(["rule", "global", "direct"] as const).map((m) => (
                  <button
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 uppercase"
                    style={{
                      background: clash.config()?.mode === m ? "var(--accent-muted)" : "var(--bg-tertiary)",
                      color: clash.config()?.mode === m ? "var(--accent)" : "var(--text-secondary)",
                      border: clash.config()?.mode === m ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent",
                    }}
                    onClick={async () => {
                      await patchConfig({ mode: m });
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Log Level">
              <select
                class="px-3 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                value={clash.config()?.log_level || "info"}
                onChange={async (e) => {
                  await patchConfig({ "log-level": e.currentTarget.value });
                }}
              >
                {["silent", "error", "warning", "info", "debug"].map((l) => (
                  <option value={l}>{l}</option>
                ))}
              </select>
            </SettingRow>
          </SettingsSection>
        </Show>

        {/* About */}
        <Show when={activeSection() === "about"}>
          <SettingsSection title="About Hyperion">
            <div class="flex flex-col items-center py-8">
              <div
                class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  "box-shadow": "0 0 30px rgba(6, 182, 212, 0.3)",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h2 class="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Hyperion
              </h2>
              <p class="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                v0.1.0-beta — Clash Kernel Frontend
              </p>
              <p class="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
                Built with SolidJS + Tauri
              </p>
              <div class="flex items-center gap-4 mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span>Clash Meta: v{clash.version()?.version || "---"}</span>
              </div>
              <p class="text-[10px] mt-6" style={{ color: "var(--text-tertiary)" }}>
                The name "Hyperion" comes from Greek mythology —
                the Titan of light, symbolizing illumination and power.
              </p>
            </div>
          </SettingsSection>
        </Show>
      </div>
    </div>
  );
}

// ==========================================
// Helper Components
// ==========================================

function SettingsSection(props: { title: string; children: any }) {
  return (
    <div
      class="rounded-xl p-5 neon-border"
      style={{ background: "var(--bg-secondary)" }}
    >
      <h2 class="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        {props.title}
      </h2>
      <div class="flex flex-col gap-4">
        {props.children}
      </div>
    </div>
  );
}

function SettingRow(props: { label: string; children: any }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-xs" style={{ color: "var(--text-secondary)" }}>
        {props.label}
      </span>
      {props.children}
    </div>
  );
}

function ToggleSwitch(props: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      class="relative w-10 h-5 rounded-full transition-all duration-200"
      style={{
        background: props.value ? "var(--accent)" : "var(--bg-hover)",
        border: `1px solid ${props.value ? "var(--accent)" : "var(--border-default)"}`,
      }}
      onClick={() => props.onChange(!props.value)}
    >
      <div
        class="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
        style={{
          left: props.value ? "21px" : "2px",
          background: props.value ? "white" : "var(--text-tertiary)",
          "box-shadow": "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}
