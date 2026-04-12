import { createSignal, For, Show, createMemo, onMount } from "solid-js";
import { clashApi } from "../services/clash-api";
import { useI18n } from "../i18n";
import type { RuleInfo, RuleProviders } from "../types/clash";
import { shorten } from "../utils/format";

export default function Rules() {
  const { t } = useI18n();
  const [rules, setRules] = createSignal<RuleInfo[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [search, setSearch] = createSignal("");
  const [ruleProviders, setRuleProviders] = createSignal<RuleProviders>({});
  const [activeTab, setActiveTab] = createSignal<"rules" | "providers">("rules");

  const filteredRules = createMemo(() => {
    const filter = search().toLowerCase().trim();
    if (!filter) return rules();
    return rules().filter(
      (rule) =>
        rule.type.toLowerCase().includes(filter) ||
        rule.payload.toLowerCase().includes(filter) ||
        rule.proxy.toLowerCase().includes(filter)
    );
  });

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await clashApi.getRules();
      setRules(data.rules);
    } catch (e) {
      console.error("Failed to load rules:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await clashApi.getRuleProviders();
      setRuleProviders(data);
    } catch (e) {
      console.error("Failed to load rule providers:", e);
    }
  };

  const updateProvider = async (name: string) => {
    try {
      await clashApi.updateRuleProvider(name);
      await loadProviders();
    } catch (e) {
      console.error("Failed to update provider:", e);
    }
  };

  const getRuleColor = (type: string): string => {
    const map: Record<string, string> = {
      DOMAIN: "var(--accent)",
      "DOMAIN-SUFFIX": "var(--accent2)",
      "DOMAIN-KEYWORD": "#f59e0b",
      IP: "var(--success)",
      "IP-CIDR": "var(--success)",
      "IP-CIDR6": "var(--success)",
      GEOIP: "var(--warning)",
      "GEOSITE": "var(--accent2)",
      "PROCESS-NAME": "#ec4899",
      "SRC-IP-CIDR": "#f97316",
      "DST-PORT": "#a78bfa",
      "SRC-PORT": "#a78bfa",
      MATCH: "var(--text-tertiary)",
    };
    return map[type] || "var(--text-secondary)";
  };

  onMount(() => {
    loadRules();
    loadProviders();
  });

  return (
    <div class="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Rules
          </h1>
          <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {rules().length} rules loaded
          </p>
        </div>
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: "var(--accent-muted)",
            color: "var(--accent)",
            border: "1px solid rgba(6,182,212,0.3)",
          }}
          onClick={loadRules}
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div class="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
        <button
          class="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
          style={{
            background: activeTab() === "rules" ? "var(--bg-tertiary)" : "transparent",
            color: activeTab() === "rules" ? "var(--text-primary)" : "var(--text-secondary)",
          }}
          onClick={() => setActiveTab("rules")}
        >
          Rules ({rules().length})
        </button>
        <button
          class="flex-1 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
          style={{
            background: activeTab() === "providers" ? "var(--bg-tertiary)" : "transparent",
            color: activeTab() === "providers" ? "var(--text-primary)" : "var(--text-secondary)",
          }}
          onClick={() => setActiveTab("providers")}
        >
          Providers ({Object.keys(ruleProviders()).length})
        </button>
      </div>

      {/* Rules Tab */}
      <Show when={activeTab() === "rules"}>
        {/* Search */}
        <input
          class="w-full px-3 py-2 rounded-lg text-xs outline-none"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
          placeholder="Search rules..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
          }}
        />

        {/* Rules List */}
        <div class="rounded-xl overflow-hidden" style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}>
          <table class="w-full text-xs">
            <thead>
              <tr style={{ "border-bottom": "1px solid var(--border-default)" }}>
                <th class="px-3 py-2.5 text-left font-medium w-8" style={{ color: "var(--text-tertiary)" }}>#</th>
                <th class="px-3 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>Type</th>
                <th class="px-3 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>Payload</th>
                <th class="px-3 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>Proxy</th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredRules()}>
                {(rule, index) => (
                  <tr
                    class="transition-colors duration-150"
                    style={{ "border-bottom": "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <td class="px-3 py-2 font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {index() + 1}
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background: `${getRuleColor(rule.type)}15`,
                          color: getRuleColor(rule.type),
                        }}
                      >
                        {rule.type}
                      </span>
                    </td>
                    <td class="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                      <div class="truncate" title={rule.payload}>
                        {rule.payload}
                      </div>
                    </td>
                    <td class="px-3 py-2" style={{ color: "var(--accent)" }}>
                      {rule.proxy}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <Show when={filteredRules().length === 0}>
            <div class="flex items-center justify-center py-10 text-xs" style={{ color: "var(--text-tertiary)" }}>
              No rules found
            </div>
          </Show>
        </div>
      </Show>

      {/* Providers Tab */}
      <Show when={activeTab() === "providers"}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <For each={Object.entries(ruleProviders())}>
            {([name, provider]) => (
              <div
                class="p-3 rounded-xl neon-border"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {name}
                  </span>
                  <button
                    class="px-2 py-1 rounded text-[10px] font-medium"
                    style={{
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                    onClick={() => updateProvider(name)}
                  >
                    Update
                  </button>
                </div>
                <div class="flex flex-col gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <span>Type: {provider.type}</span>
                  <span>Behavior: {provider.behavior}</span>
                  <span>Rules: {provider.rule_count}</span>
                  <span>Updated: {provider.updatedAt}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
