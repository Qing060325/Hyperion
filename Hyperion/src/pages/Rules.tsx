import { createSignal, createEffect, For, Show } from "solid-js";
import { Search } from "lucide-solid";
import { useClashStore } from "@/stores/clash";

interface Rule {
  type: string;
  payload: string;
  proxy: string;
}

function getTypeBadge(type: string) {
  const t = type.toUpperCase();
  if (t.includes("DOMAIN")) return "badge-primary";
  if (t.includes("IP-CIDR") || t.includes("IP")) return "badge-purple";
  if (t.includes("GEOIP") || t.includes("GEOSITE")) return "badge-teal";
  if (t.includes("PROCESS") || t.includes("RULE-SET")) return "badge-warning";
  if (t.includes("MATCH")) return "badge-neutral";
  return "badge-ghost";
}

function getPolicyBadge(policy: string) {
  const p = policy.toUpperCase();
  if (p === "DIRECT") return "badge-success badge-outline";
  if (p === "REJECT" || p === "REJECT-DROP") return "badge-error badge-outline";
  return "badge-info badge-outline";
}

export default function Rules() {
  const clash = useClashStore();
  const [rules, setRules] = createSignal<Rule[]>([]);
  const [search, setSearch] = createSignal("");

  const fetchRules = async () => {
    try {
      const res = await fetch(`${clash.baseUrl()}/rules`, { headers: clash.headers() });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch {}
  };

  createEffect(() => {
    if (clash.connected()) fetchRules();
  });

  const filtered = () => {
    const q = search().toLowerCase();
    if (!q) return rules();
    return rules().filter(
      (r) =>
        r.type.toLowerCase().includes(q) ||
        r.payload.toLowerCase().includes(q) ||
        r.proxy.toLowerCase().includes(q)
    );
  };

  return (
    <div class="animate-page-in space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">规则</h1>
          <p class="text-sm text-base-content/50 mt-0.5">
            路由规则列表 · {rules().length} 条规则
          </p>
        </div>
      </div>

      <div class="relative">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          placeholder="搜索规则类型、匹配内容或策略..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="input input-bordered input-sm w-full max-w-lg rounded-xl pl-9 bg-base-100"
        />
      </div>

      <div class="card bg-base-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="border-b border-base-300">
                <th class="w-12 text-xs font-medium text-base-content/50">#</th>
                <th class="text-xs font-medium text-base-content/50">类型</th>
                <th class="text-xs font-medium text-base-content/50">匹配内容</th>
                <th class="text-xs font-medium text-base-content/50">策略</th>
              </tr>
            </thead>
            <tbody>
              <For each={filtered()}>
                {(rule, i) => (
                  <tr class="list-row hover:bg-base-200/50 border-b border-base-200/50 animate-fade-left" style={{ "animation-delay": `${Math.min(i(), 20) * 20}ms` }}>
                    <td class="text-xs text-base-content/30 font-mono">{i() + 1}</td>
                    <td>
                      <span class={`badge badge-sm ${getTypeBadge(rule.type)}`}>
                        {rule.type}
                      </span>
                    </td>
                    <td class="text-xs font-mono max-w-[400px] truncate">{rule.payload}</td>
                    <td>
                      <span class={`badge badge-sm ${getPolicyBadge(rule.proxy)}`}>
                        {rule.proxy}
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        <Show when={filtered().length === 0}>
          <div class="text-center py-12 text-base-content/30">
            <p class="text-sm">未找到匹配的规则</p>
          </div>
        </Show>
      </div>
    </div>
  );
}
