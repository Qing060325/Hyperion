import { createSignal, createEffect, For, Show } from "solid-js";
import { Search, Zap, ChevronDown, ChevronRight } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import type { ClashProxy, ClashProxyGroup } from "@/types/clash";

function getDelayClass(delay: number) {
  if (!delay || delay === 0) return "delay-badge-timeout";
  if (delay <= 200) return "delay-badge-excellent";
  if (delay <= 500) return "delay-badge-good";
  if (delay <= 1000) return "delay-badge-moderate";
  return "delay-badge-poor";
}

function getDelayText(delay: number) {
  if (!delay || delay === 0) return "超时";
  return `${delay}ms`;
}

function getProtocolLabel(type: string) {
  const map: Record<string, string> = {
    Shadowsocks: "SS",
    VMess: "VMess",
    Trojan: "Trojan",
    VLESS: "VLESS",
    Hysteria2: "H2",
    Hysteria: "H1",
    TUIC: "TUIC",
    WireGuard: "WG",
    Direct: "直连",
    Reject: "拒绝",
    HTTP: "HTTP",
    SOCKS5: "S5",
    Compatible: "兼容",
    Selector: "选择",
    URLTest: "自动",
    Fallback: "备选",
    LoadBalance: "负载",
  };
  return map[type] || type;
}

const GROUP_TYPES = new Set(["Selector", "URLTest", "Fallback", "LoadBalance", "Compatible"]);

export default function Proxies() {
  const clash = useClashStore();
  const [proxies, setProxies] = createSignal<Record<string, ClashProxy>>({});
  const [groups, setGroups] = createSignal<ClashProxyGroup[]>([]);
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());
  const [search, setSearch] = createSignal("");
  const [testing, setTesting] = createSignal(false);
  const [testingNode, setTestingNode] = createSignal<string | null>(null);
  const [hasGroups, setHasGroups] = createSignal(true);

  const fetchProxies = async () => {
    try {
      const res = await fetch(`${clash.baseUrl()}/proxies`, { headers: clash.headers() });
      if (res.ok) {
        const data = await res.json();
        setProxies(data.proxies || {});

        // Detect proxy groups (Clash Meta style: has 'all' field)
        const metaGroups = Object.values(data.proxies || {}).filter(
          (p: any) => p.all !== undefined || p.now !== undefined
        ) as ClashProxyGroup[];

        if (metaGroups.length > 0) {
          setGroups(metaGroups);
          setHasGroups(true);
        } else {
          // Hades / minimal API: no groups, synthesize one from all nodes
          setHasGroups(false);
          const allEntries = Object.entries(data.proxies || {}).filter(
            ([, v]: any) => v.type && !["Direct", "Reject"].includes(v.type)
          );
          if (allEntries.length > 0) {
            const synthetic: ClashProxyGroup = {
              name: "全部节点",
              type: "Selector",
              now: allEntries[0][0],
              all: allEntries.map(([name]) => name),
            };
            setGroups([synthetic]);
            setExpanded(new Set(["全部节点"]));
          }
        }
      }
    } catch (e) { console.error(e) }
  };

  createEffect(() => {
    if (clash.connected()) fetchProxies();
  });

  const toggleGroup = (name: string) => {
    const next = new Set(expanded());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpanded(next);
  };

  const selectProxy = async (group: string, name: string) => {
    try {
      await fetch(`${clash.baseUrl()}/proxies/${encodeURIComponent(group)}`, {
        method: "PUT",
        headers: clash.headers(),
        body: JSON.stringify({ name }),
      });
      fetchProxies();
    } catch (e) { console.error(e) }
  };

  const testDelay = async (group: string, name: string) => {
    setTestingNode(name);
    try {
      const params = new URLSearchParams({ timeout: "5000", url: "https://www.gstatic.com/generate_204" });
      const token = clash.token();
      if (token) params.set("token", token);
      await fetch(
        `${clash.baseUrl()}/proxies/${encodeURIComponent(name)}/delay?${params}`
      );
      setTimeout(fetchProxies, 500);
    } catch (e) { console.error(e) }
    setTestingNode(null);
  };

  const testAll = async () => {
    setTesting(true);
    const g = groups();
    for (const group of g) {
      try {
        const all = group.all || [];
        const params = new URLSearchParams({ timeout: "5000", url: "https://www.gstatic.com/generate_204" });
        const token = clash.token();
        if (token) params.set("token", token);
        // Try Clash Meta group delay API
        await fetch(
          `${clash.baseUrl()}/group/${encodeURIComponent(group.name)}/delay?${params}`,
          { method: "GET" }
        );
      } catch (e) { console.error(e) }
    }
    setTimeout(() => {
      fetchProxies();
      setTesting(false);
    }, 2000);
  };

  const getGroupNodes = (group: ClashProxyGroup) => {
    const all = group.all || [];
    const allProxies = proxies();
    return all
      .map((name) => allProxies[name])
      .filter(Boolean)
      .filter((p) => {
        const q = search().toLowerCase();
        if (!q) return true;
        return p.name.toLowerCase().includes(q);
      });
  };

  return (
    <div class="animate-page-in space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">代理</h1>
          <p class="text-sm text-base-content/50 mt-0.5">
            管理代理节点和代理组
            <Show when={!hasGroups()}>
              <span class="badge badge-warning badge-sm ml-2">兼容模式</span>
            </Show>
          </p>
        </div>
        <button
          class={`btn btn-primary btn-sm rounded-xl gap-1.5 ${testing() ? "loading" : ""}`}
          onClick={testAll}
        >
          <Zap size={14} />
          全部测速
        </button>
      </div>

      {/* Search */}
      <div class="relative">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          placeholder="搜索节点..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="input input-bordered input-sm w-full max-w-md rounded-xl pl-9 bg-base-100"
        />
      </div>

      {/* Proxy Groups */}
      <div class="space-y-3">
        <For each={groups()}>
          {(group, gi) => {
            const isExpanded = () => expanded().has(group.name);
            const nodes = () => getGroupNodes(group);
            const isAuto = () => ["URLTest", "Fallback", "LoadBalance"].includes(group.type);

            return (
              <div class="card bg-base-100 animate-card-in" style={{ "animation-delay": `${gi() * 60}ms` }}>
                {/* Group Header */}
                <button
                  class="w-full flex items-center justify-between p-4 hover:bg-base-200/50 rounded-xl transition-colors"
                  onClick={() => toggleGroup(group.name)}
                >
                  <div class="flex items-center gap-3">
                    {isExpanded() ? <ChevronDown size={16} class="text-base-content/40" /> : <ChevronRight size={16} class="text-base-content/40" />}
                    <span class="font-medium">{group.name}</span>
                    <span class="badge badge-ghost badge-sm">{nodes().length}</span>
                    {isAuto() && <span class="badge badge-primary badge-sm badge-outline">自动</span>}
                  </div>
                  <Show when={group.now}>
                    <span class="text-xs text-base-content/50 truncate max-w-[200px]">
                      {group.now}
                    </span>
                  </Show>
                </button>

                {/* Nodes */}
                <Show when={isExpanded()}>
                  <div class="px-3 pb-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      <For each={nodes()}>
                        {(node, ni) => {
                          const isActive = () => group.now === node.name;
                          const isTesting = () => testingNode() === node.name;

                          return (
                            <button
                              class={`proxy-card flex items-center justify-between p-3 rounded-xl border text-left ${
                                isActive()
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-base-300 bg-base-200/40 hover:bg-base-200"
                              }`}
                              onClick={() => selectProxy(group.name, node.name)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                testDelay(group.name, node.name);
                              }}
                              style={{ "animation-delay": `${ni() * 30}ms` }}
                            >
                              <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5">
                                  {isActive() && (
                                    <span class="w-1.5 h-1.5 rounded-full bg-primary animate-subtle-pulse flex-shrink-0" />
                                  )}
                                  <span class="text-sm font-medium truncate">
                                    {node.name.replace(/^[\p{Emoji}\s]+/u, "")}
                                  </span>
                                </div>
                                <span class="text-[11px] text-base-content/40 mt-0.5 block">
                                  {getProtocolLabel(node.type)}
                                </span>
                              </div>
                              <span
                                class={`badge badge-sm font-mono text-[11px] ${getDelayClass(node.history?.[node.history.length - 1]?.delay || 0)} ${
                                  isTesting() ? "animate-subtle-pulse" : ""
                                }`}
                              >
                                {isTesting() ? "..." : getDelayText(node.history?.[node.history.length - 1]?.delay || 0)}
                              </span>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
