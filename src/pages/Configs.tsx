import { createSignal, createEffect, For, Show } from "solid-js";
import { RefreshCw, MapPin, Database, RotateCcw } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import ripple from "@/components/ui/RippleEffect";

interface ClashConfigData {
  "mixed-port"?: number;
  port?: number;
  "socks-port"?: number;
  mode?: string;
  "log-level"?: string;
  "allow-lan"?: boolean;
  tun?: { enable?: boolean };
  ipv6?: boolean;
  [key: string]: unknown;
}

interface ProxyProvider {
  name: string;
  vehicleType: string;
  type: string;
  updatedAt?: string;
}

export default function Configs() {
  const clash = useClashStore();
  const [config, setConfig] = createSignal<ClashConfigData | null>(null);
  const [providers, setProviders] = createSignal<ProxyProvider[]>([]);
  const [loading, setLoading] = createSignal<string | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${clash.baseUrl()}/configs`, { headers: clash.headers() });
      if (res.ok) setConfig(await res.json());
    } catch (e) { console.error(e) }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${clash.baseUrl()}/providers/proxies`, { headers: clash.headers() });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) { console.error(e) }
  };

  createEffect(() => {
    if (clash.connected()) {
      fetchConfig();
      fetchProviders();
    }
  });

  const action = async (name: string, fn: () => Promise<void>) => {
    setLoading(name);
    await fn();
    setLoading(null);
    setTimeout(() => { fetchConfig(); fetchProviders(); }, 500);
  };

  const reloadConfig = () => action("reload", async () => {
    await fetch(`${clash.baseUrl()}/configs`, { method: "PUT", headers: clash.headers(), body: JSON.stringify({ path: "" }) });
  });

  const updateGeoIP = () => action("geoip", async () => {
    await fetch(`${clash.baseUrl()}/configs/geo`, { method: "POST", headers: clash.headers(), body: JSON.stringify({ name: "geoip.dat" }) });
  });

  const updateGeoSite = () => action("geosite", async () => {
    await fetch(`${clash.baseUrl()}/configs/geo`, { method: "POST", headers: clash.headers(), body: JSON.stringify({ name: "geosite.dat" }) });
  });

  const restartCore = () => action("restart", async () => {
    await fetch(`${clash.baseUrl()}/restart`, { method: "POST", headers: clash.headers() });
  });

  const updateProvider = async (name: string) => {
    try {
      await fetch(`${clash.baseUrl()}/providers/proxies/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: clash.headers(),
      });
      setTimeout(fetchProviders, 1000);
    } catch (e) { console.error(e) }
  };

  const actions = [
    { name: "reload", icon: RefreshCw, label: "重载配置", desc: "重新加载 Clash 配置文件", action: reloadConfig },
    { name: "geoip", icon: MapPin, label: "更新 GeoIP", desc: "更新 GeoIP 数据库", action: updateGeoIP },
    { name: "geosite", icon: Database, label: "更新 GeoSite", desc: "更新 GeoSite 数据库", action: updateGeoSite },
    { name: "restart", icon: RotateCcw, label: "重启内核", desc: "安全重启 Clash Meta", action: restartCore },
  ];

  const configInfo = () => {
    const c = config();
    if (!c) return [];
    return [
      { label: "端口 (Mixed)", value: c["mixed-port"] || "-" },
      { label: "HTTP 端口", value: c.port || "-" },
      { label: "Socks 端口", value: c["socks-port"] || "-" },
      { label: "模式", value: c.mode || "-" },
      { label: "日志级别", value: c["log-level"] || "-" },
      { label: "允许局域网", value: c["allow-lan"] ? "是" : "否" },
      { label: "TUN 模式", value: c.tun?.enable ? "是" : "否" },
      { label: "IPv6", value: c.ipv6 ? "是" : "否" },
    ];
  };

  return (
    <div class="animate-page-in-enhanced space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">配置</h1>
        <p class="text-sm text-base-content/50 mt-0.5">管理 Clash 内核配置和数据库</p>
      </div>

      {/* Action Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <For each={actions}>
          {(a, i) => {
            const Icon = a.icon;
            return (
              <div class="stat-card card bg-base-100 p-4 animate-card-spring" style={{ "animation-delay": `${i() * 60}ms` }}>
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon size={16} />
                  </div>
                  <span class="font-medium text-sm">{a.label}</span>
                </div>
                <p class="text-xs text-base-content/50 mb-3">{a.desc}</p>
                <button
                  use:ripple
                  class={`btn btn-sm btn-primary btn-outline rounded-xl w-full ${loading() === a.name ? "loading" : ""}`}
                  onClick={a.action}
                >
                  执行
                </button>
              </div>
            );
          }}
        </For>
      </div>

      {/* Config Info */}
      <div class="card bg-base-100 animate-card-spring stagger-5">
        <div class="p-4 border-b border-base-300">
          <span class="font-medium text-sm">配置信息</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <For each={configInfo()}>
            {(item) => (
              <div class="flex items-center justify-between px-4 py-2.5">
                <span class="text-sm text-base-content/60">{item.label}</span>
                <span class="text-sm font-medium font-mono">{String(item.value)}</span>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Providers */}
      <div class="card bg-base-100 animate-card-spring stagger-6">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <span class="font-medium text-sm">代理集 (Providers)</span>
          <span class="badge badge-sm badge-ghost">{providers().length}</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <For each={providers()}>
            {(p) => (
              <div class="flex items-center justify-between px-4 py-3">
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{p.name}</div>
                  <div class="text-xs text-base-content/40">
                    {p.vehicleType} · {p.type} · 更新于 {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "-"}
                  </div>
                </div>
                <button use:ripple class="btn btn-xs btn-ghost rounded-xl" onClick={() => updateProvider(p.name)}>
                  更新
                </button>
              </div>
            )}
          </For>
          <Show when={providers().length === 0}>
            <div class="text-center py-6 text-base-content/30 text-sm">暂无代理集</div>
          </Show>
        </div>
      </div>
    </div>
  );
}
