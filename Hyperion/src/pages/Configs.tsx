import { createSignal, onMount } from "solid-js";
import { clashApi } from "../services/clash-api";
import { useClashStore } from "../stores/clash";
import { useI18n } from "../i18n";
import type { ProxyProviders } from "../types/clash";

export default function Configs() {
  const { t } = useI18n();
  const clash = useClashStore();

  const [configPath, setConfigPath] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [geoUpdating, setGeoUpdating] = createSignal(false);
  const [proxyProviders, setProxyProviders] = createSignal<ProxyProviders>({});

  const loadProviders = async () => {
    try {
      const data = await clashApi.getProxyProviders();
      setProxyProviders(data);
    } catch (e) {
      console.error("Failed to load providers:", e);
    }
  };

  const reloadConfig = async () => {
    try {
      setLoading(true);
      await clashApi.reloadConfig(configPath());
      // Refresh store
      await clash.connect();
    } catch (e) {
      console.error("Failed to reload config:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateGeo = async () => {
    try {
      setGeoUpdating(true);
      await clashApi.updateGeoData();
    } catch (e) {
      console.error("Failed to update GeoIP:", e);
    } finally {
      setGeoUpdating(false);
    }
  };

  const restartCore = async () => {
    try {
      await clashApi.restart();
    } catch (e) {
      console.error("Failed to restart:", e);
    }
  };

  const updateProvider = async (name: string) => {
    try {
      await clashApi.updateProxyProvider(name);
      await loadProviders();
    } catch (e) {
      console.error("Failed to update provider:", e);
    }
  };

  onMount(() => {
    loadProviders();
  });

  return (
    <div class="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Configs
        </h1>
        <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          Manage Clash configuration
        </p>
      </div>

      {/* Actions */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          class="p-4 rounded-xl neon-border transition-all duration-200"
          style={{ background: "var(--bg-secondary)" }}
          onClick={reloadConfig}
          disabled={loading()}
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Reload Config
              </div>
              <div class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Reload Clash configuration file
              </div>
            </div>
          </div>
        </button>

        <button
          class="p-4 rounded-xl neon-border transition-all duration-200"
          style={{ background: "var(--bg-secondary)" }}
          onClick={updateGeo}
          disabled={geoUpdating()}
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent2-muted)", color: "var(--accent2)" }}>
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Update GeoIP
              </div>
              <div class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Update GeoIP and GeoSite databases
              </div>
            </div>
          </div>
        </button>

        <button
          class="p-4 rounded-xl neon-border transition-all duration-200"
          style={{ background: "var(--bg-secondary)" }}
          onClick={restartCore}
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--warning-muted)", color: "var(--warning)" }}>
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Restart Core
              </div>
              <div class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Restart Clash Meta core
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Config Info */}
      <div class="rounded-xl p-4 neon-border" style={{ background: "var(--bg-secondary)" }}>
        <h3 class="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Configuration Info
        </h3>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <InfoRow label="Mode" value={clash.config()?.mode?.toUpperCase() || "---"} />
          <InfoRow label="Mixed Port" value={String(clash.config()?.mixed_port || "---")} />
          <InfoRow label="Allow LAN" value={clash.config()?.allow_lan ? "Yes" : "No"} />
          <InfoRow label="Log Level" value={clash.config()?.log_level || "---"} />
          <InfoRow label="IPv6" value={clash.config()?.ipv6 ? "Enabled" : "Disabled"} />
          <InfoRow label="TUN" value={clash.config()?.tun?.enable ? "Enabled" : "Disabled"} />
          <InfoRow label="External Controller" value={clash.config()?.external_controller || "---"} />
          <InfoRow label="Version" value={clash.version()?.version || "---"} />
        </div>
      </div>

      {/* Proxy Providers */}
      <div class="rounded-xl p-4 neon-border" style={{ background: "var(--bg-secondary)" }}>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Proxy Providers
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(proxyProviders()).map(([name, provider]) => (
            <div
              class="p-3 rounded-lg transition-colors duration-200"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {name}
                </span>
                <button
                  class="px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ml-2"
                  style={{
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                  }}
                  onClick={() => updateProvider(name)}
                >
                  Update
                </button>
              </div>
              <div class="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                <span>{provider.proxies.length} nodes</span>
                <span>{provider.vehicle_type}</span>
                {provider.subscriptionInfo && (
                  <span>
                    {provider.subscriptionInfo.Upload > 0 && "Has traffic info"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between py-1.5 px-2 rounded" style={{ background: "var(--bg-tertiary)" }}>
      <span style={{ color: "var(--text-tertiary)" }}>{props.label}</span>
      <span class="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
        {props.value}
      </span>
    </div>
  );
}
