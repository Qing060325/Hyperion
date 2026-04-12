import { createSignal, For, Show, onMount } from "solid-js";
import { clashApi } from "../services/clash-api";
import { useI18n } from "../i18n";
import type { ProxyMap, ProxyInfo } from "../types/clash";
import { getDelayColor, formatDelay } from "../utils/color";

// ==========================================
// Proxy Node Card
// ==========================================
function ProxyNodeCard(props: {
  proxy: ProxyInfo;
  isActive: boolean;
  onSelect: () => void;
  onTestDelay: () => void;
}) {
  const delayColor = () => getDelayColor(props.proxy.history?.[0]?.delay);

  return (
    <div
      class="p-3 rounded-lg cursor-pointer transition-all duration-200"
      style={{
        background: props.isActive ? "var(--accent-muted)" : "var(--bg-tertiary)",
        border: `1px solid ${props.isActive ? "rgba(6,182,212,0.3)" : "var(--border-subtle)"}`,
      }}
      onClick={props.onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        props.onTestDelay();
      }}
      onMouseEnter={(e) => {
        if (!props.isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
        }
      }}
      onMouseLeave={(e) => {
        if (!props.isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
        }
      }}
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {props.proxy.name}
            </span>
            <span
              class="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-tertiary)",
              }}
            >
              {props.proxy.type}
            </span>
          </div>
        </div>
        <div
          class="flex-shrink-0 px-2 py-0.5 rounded text-xs font-mono font-medium ml-2"
          style={{
            background: delayColor().bg,
            color: delayColor().text,
          }}
        >
          {formatDelay(props.proxy.history?.[0]?.delay)}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Proxy Group
// ==========================================
function ProxyGroup(props: {
  name: string;
  proxy: ProxyInfo;
  allProxies: ProxyMap;
  onSelectProxy: (group: string, name: string) => void;
  onTestDelay: (name: string) => void;
}) {
  const [expanded, setExpanded] = createSignal(true);
  const [filter, setFilter] = createSignal("");

  const nodes = () => {
    const all = props.proxy.all || [];
    if (!filter()) return all;
    return all.filter((name) => name.toLowerCase().includes(filter().toLowerCase()));
  };

  const isSelector = () =>
    props.proxy.type === "Selector" ||
    props.proxy.type === "URLTest" ||
    props.proxy.type === "Fallback" ||
    props.proxy.type === "LoadBalance";

  return (
    <div
      class="rounded-xl overflow-hidden neon-border"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Group Header */}
      <div
        class="flex items-center justify-between p-3 cursor-pointer"
        style={{ "border-bottom": expanded() ? "1px solid var(--border-subtle)" : "none" }}
        onClick={() => setExpanded(!expanded())}
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-3.5 h-3.5 transition-transform duration-200"
            style={{
              transform: expanded() ? "rotate(90deg)" : "rotate(0deg)",
              color: "var(--text-tertiary)",
            }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
          <span class="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {props.name}
          </span>
          <span class="text-[10px] px-1.5 py-0.5 rounded" style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-tertiary)",
          }}>
            {props.proxy.type}
          </span>
          <span class="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            ({(props.proxy.all || []).length})
          </span>
        </div>
        <div class="flex items-center gap-2">
          {props.proxy.now && (
            <span class="text-xs" style={{ color: "var(--accent)" }}>
              {props.proxy.now}
            </span>
          )}
        </div>
      </div>

      {/* Group Content */}
      <Show when={expanded()}>
        <div class="p-3">
          {/* Search */}
          {(props.proxy.all || []).length > 5 && (
            <input
              class="w-full px-3 py-1.5 rounded-lg text-xs mb-3 outline-none"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
              placeholder="Search nodes..."
              value={filter()}
              onInput={(e) => setFilter(e.currentTarget.value)}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
              }}
            />
          )}

          {/* Node List */}
          <div class="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            <For each={nodes()}>
              {(nodeName) => {
                const nodeProxy = () => props.allProxies[nodeName];
                return (
                  <Show when={nodeProxy()}>
                    {(proxy) => (
                      <ProxyNodeCard
                        proxy={proxy()}
                        isActive={props.proxy.now === nodeName}
                        onSelect={() => props.onSelectProxy(props.name, nodeName)}
                        onTestDelay={() => props.onTestDelay(nodeName)}
                      />
                    )}
                  </Show>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}

// ==========================================
// Proxies Page
// ==========================================
export default function Proxies() {
  const { t } = useI18n();
  const [proxies, setProxies] = createSignal<ProxyMap>({});
  const [loading, setLoading] = createSignal(true);
  const [testing, setTesting] = createSignal<string | null>(null);

  const loadProxies = async () => {
    try {
      setLoading(true);
      const data = await clashApi.getProxies();
      setProxies(data);
    } catch (e) {
      console.error("Failed to load proxies:", e);
    } finally {
      setLoading(false);
    }
  };

  const selectProxy = async (group: string, name: string) => {
    try {
      await clashApi.selectProxy(group, name);
      // Refresh proxy list
      await loadProxies();
    } catch (e) {
      console.error("Failed to select proxy:", e);
    }
  };

  const testDelay = async (name: string) => {
    setTesting(name);
    try {
      await clashApi.testDelay(name);
      await loadProxies();
    } catch (e) {
      console.error("Failed to test delay:", e);
    } finally {
      setTesting(null);
    }
  };

  const testAllDelays = async () => {
    const proxyData = proxies();
    for (const [name, proxy] of Object.entries(proxyData)) {
      if (proxy.all && proxy.all.length > 0) {
        for (const nodeName of proxy.all) {
          testDelay(nodeName);
        }
      }
    }
  };

  // Get only group-type proxies (Selector, URLTest, Fallback, LoadBalance)
  const groups = () => {
    const proxyData = proxies();
    return Object.entries(proxyData)
      .filter(([, proxy]) =>
        ["Selector", "URLTest", "Fallback", "LoadBalance"].includes(proxy.type)
      )
      .sort(([a], [b]) => a.localeCompare(b));
  };

  onMount(loadProxies);

  return (
    <div class="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Proxies
          </h1>
          <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Manage proxy groups and nodes. Right-click to test latency.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
            onClick={testAllDelays}
          >
            Test All
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid rgba(6,182,212,0.3)",
            }}
            onClick={loadProxies}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Proxy Groups */}
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center justify-center py-20">
            <div class="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Loading...
            </div>
          </div>
        }
      >
        <div class="flex flex-col gap-3">
          <For each={groups()}>
            {([name, proxy]) => (
              <ProxyGroup
                name={name}
                proxy={proxy}
                allProxies={proxies()}
                onSelectProxy={selectProxy}
                onTestDelay={testDelay}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
