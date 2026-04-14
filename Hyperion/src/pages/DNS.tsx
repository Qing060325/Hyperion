import { createSignal, Show, For } from "solid-js";
import { Search, Trash2 } from "lucide-solid";
import { useClashStore } from "@/stores/clash";

const recordTypes = ["A", "AAAA", "CNAME", "TXT", "MX", "NS"];

interface DNSResult {
  Status: number;
  Question: { Name: string; Type: number }[];
  Answer?: { name: string; type: number; TTL: number; data: string }[];
}

export default function DNS() {
  const clash = useClashStore();
  const [domain, setDomain] = createSignal("");
  const [recordType, setRecordType] = createSignal("A");
  const [results, setResults] = createSignal<DNSResult | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [fakeIPCount, setFakeIPCount] = createSignal(0);

  const queryDNS = async () => {
    if (!domain()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ name: domain(), type: recordType() });
      const token = clash.token();
      if (token) params.set("token", token);
      const res = await fetch(`${clash.baseUrl()}/dns/query?${params}`, { headers: clash.headers() });
      if (res.ok) setResults(await res.json());
    } catch (e) { console.error(e) }
    setLoading(false);
  };

  const fetchFakeIP = async () => {
    try {
      const res = await fetch(`${clash.baseUrl()}/cache/fakeip/count`, { headers: clash.headers() });
      if (res.ok) {
        const data = await res.json();
        setFakeIPCount(data.count || 0);
      }
    } catch (e) { console.error(e) }
  };

  const flushFakeIP = async () => {
    try {
      await fetch(`${clash.baseUrl()}/cache/fakeip/flush`, { method: "POST", headers: clash.headers() });
      setFakeIPCount(0);
    } catch (e) { console.error(e) }
  };

  fetchFakeIP();

  return (
    <div class="animate-page-in space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">DNS</h1>
        <p class="text-sm text-base-content/50 mt-0.5">DNS 查询和 Fake-IP 缓存管理</p>
      </div>

      {/* DNS Query */}
      <div class="card bg-base-100 animate-card-in stagger-1">
        <div class="p-4 border-b border-base-300">
          <span class="font-medium text-sm">DNS 查询</span>
        </div>
        <div class="p-4">
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="输入域名..."
              value={domain()}
              onInput={(e) => setDomain(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && queryDNS()}
              class="input input-bordered input-sm flex-1 rounded-xl bg-base-200"
            />
            <select
              class="select select-bordered select-sm rounded-xl bg-base-200"
              value={recordType()}
              onChange={(e) => setRecordType(e.currentTarget.value)}
            >
              <For each={recordTypes}>{(t) => <option value={t}>{t}</option>}</For>
            </select>
            <button class={`btn btn-primary btn-sm rounded-xl ${loading() ? "loading" : ""}`} onClick={queryDNS}>
              <Search size={14} />
              查询
            </button>
          </div>

          <Show when={results()}>
            {(r) => (
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class={`badge badge-sm ${r().Status === 0 ? "badge-success" : "badge-error"}`}>
                    {r().Status === 0 ? "成功" : `错误 (${r().Status})`}
                  </span>
                  <Show when={r().Question?.[0]}>
                    <span class="text-xs text-base-content/50">{r().Question[0].Name}</span>
                  </Show>
                </div>
                <Show when={r().Answer && r().Answer.length > 0}>
                  <div class="space-y-1">
                    <For each={r().Answer}>
                      {(a) => (
                        <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-base-200/50 text-sm">
                          <span class="font-mono text-base-content/80">{a.data}</span>
                          <span class="text-xs text-base-content/40">TTL: {a.TTL}s</span>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            )}
          </Show>
        </div>
      </div>

      {/* Fake-IP */}
      <div class="card bg-base-100 animate-card-in stagger-2">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <span class="font-medium text-sm">Fake-IP 缓存</span>
          <span class="badge badge-sm badge-ghost">{fakeIPCount()} 条</span>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <p class="text-sm text-base-content/70">当前缓存 {fakeIPCount()} 条 Fake-IP 映射记录</p>
            <p class="text-xs text-base-content/40 mt-0.5">清除缓存可解决 DNS 解析异常问题</p>
          </div>
          <button class="btn btn-sm btn-error btn-outline rounded-xl gap-1.5" onClick={flushFakeIP}>
            <Trash2 size={14} />
            清除缓存
          </button>
        </div>
      </div>
    </div>
  );
}
