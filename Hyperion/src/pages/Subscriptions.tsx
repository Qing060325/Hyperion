import { createSignal, createEffect, For, Show } from "solid-js";
import {
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Download,
  Globe,
  ArrowUpDown,
  AlertCircle,
  Info,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { formatBytes } from "@/utils/format";

interface Provider {
  name: string;
  type: string;
  vehicleType: string;
  updatedAt: string;
  subscriptionInfo?: {
    Upload: number;
    Download: number;
    Total: number;
    Expire: number;
  };
}

export default function Subscriptions() {
  const clash = useClashStore();
  const [providers, setProviders] = createSignal<[string, Provider][]>([]);
  const [showModal, setShowModal] = createSignal(false);
  const [formUrl, setFormUrl] = createSignal("");
  const [formName, setFormName] = createSignal("");
  const [copied, setCopied] = createSignal("");
  const [updating, setUpdating] = createSignal<string | null>(null);
  const [configText, setConfigText] = createSignal("");
  const [error, setError] = createSignal("");
  const [step, setStep] = createSignal<"input" | "config">("input");

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${clash.baseUrl()}/providers/proxies`, {
        headers: clash.headers(),
      });
      if (res.ok) {
        const data = await res.json();
        const entries = Object.entries(data.providers || {}) as [string, Provider][];
        setProviders(entries.filter(([, v]) => v.type === "HTTP" || v.type === "File"));
      }
    } catch (e) { console.error(e) }
  };

  createEffect(() => {
    if (clash.connected()) fetchProviders();
  });

  const updateProvider = async (name: string) => {
    setUpdating(name);
    try {
      await fetch(`${clash.baseUrl()}/providers/proxies/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: clash.headers(),
      });
      setTimeout(fetchProviders, 1500);
    } catch (e) { console.error(e) }
    setUpdating(null);
  };

  const generateConfig = () => {
    const url = formUrl().trim();
    const name = formName().trim() || `sub-${Date.now()}`;
    if (!url) {
      setError("请输入订阅链接");
      return;
    }
    setError("");

    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const config = `# ===== ${cleanName} 订阅配置 =====
# 将以下内容添加到 config.yaml 中

proxy-providers:
  ${cleanName}:
    type: http
    url: "${url}"
    interval: 3600
    path: ./providers/${cleanName}.yaml
    health-check:
      enable: true
      interval: 300
      url: https://www.gstatic.com/generate_204
      lazy: false

# 在 proxy-groups 中引用此订阅的节点，例如：
# proxy-groups:
#   - name: "PROXY"
#     type: select
#     use:
#       - ${cleanName}
`;
    setConfigText(config);
    setStep("config");
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([configText()], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proxy-provider.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openModal = () => {
    setFormUrl("");
    setFormName("");
    setConfigText("");
    setError("");
    setStep("input");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStep("input");
  };

  const getTrafficPercent = (info?: { Upload: number; Download: number; Total: number }) => {
    if (!info?.Total) return 0;
    return Math.min(100, ((info.Upload + info.Download) / info.Total) * 100);
  };

  const getExpireDate = (ts: number) => {
    if (!ts) return "永久";
    return new Date(ts * 1000).toLocaleDateString("zh-CN");
  };

  const isExpired = (ts: number) => {
    if (!ts) return false;
    return ts * 1000 < Date.now();
  };

  return (
    <div class="animate-page-in space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">订阅</h1>
          <p class="text-sm text-base-content/50 mt-0.5">
            管理代理订阅 · {providers().length} 个订阅源
          </p>
        </div>
        <button class="btn btn-primary btn-sm rounded-xl gap-1.5" onClick={openModal}>
          <Plus size={14} />
          导入订阅
        </button>
      </div>

      {/* Providers */}
      <div class="space-y-3">
        <For each={providers()}>
          {([name, provider], i) => (
            <div
              class="card bg-base-100 animate-card-in"
              style={{ "animation-delay": `${i() * 60}ms` }}
            >
              <div class="p-4">
                {/* Top row */}
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe size={16} class="text-primary" />
                    </div>
                    <div>
                      <span class="font-medium text-sm">{name}</span>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[11px] text-base-content/40">
                          {provider.vehicleType} · {provider.type}
                        </span>
                        {provider.updatedAt && (
                          <span class="text-[11px] text-base-content/30">
                            更新于 {new Date(provider.updatedAt).toLocaleString("zh-CN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      class={`btn btn-ghost btn-xs btn-square ${updating() === name ? "loading" : ""}`}
                      onClick={() => updateProvider(name)}
                      title="更新订阅"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      class="btn btn-ghost btn-xs btn-square"
                      onClick={() =>
                        copyToClipboard(
                          `proxy-providers:\n  ${name}:\n    type: http\n    url: "YOUR_SUB_URL"\n    interval: 3600`,
                          `ref-${name}`
                        )
                      }
                      title="复制配置引用"
                    >
                      {copied() === `ref-${name}` ? (
                        <Check size={14} class="text-success" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Traffic info */}
                <Show when={provider.subscriptionInfo}>
                  {(info) => (
                    <div class="bg-base-200/40 rounded-lg p-3 space-y-2">
                      <div class="flex justify-between text-xs">
                        <span class="text-base-content/60">
                          已用 {formatBytes(info().Upload + info().Download)}
                        </span>
                        <span class="text-base-content/60">
                          总计 {formatBytes(info().Total)}
                        </span>
                      </div>
                      <progress
                        class={`progress w-full h-1.5 ${
                          isExpired(info().Expire)
                            ? "progress-error"
                            : getTrafficPercent(info()) > 80
                            ? "progress-warning"
                            : "progress-primary"
                        }`}
                        value={getTrafficPercent(info())}
                        max="100"
                      />
                      <div class="flex justify-between text-[11px] text-base-content/40">
                        <span>
                          剩余{" "}
                          {info().Total
                            ? formatBytes(
                                info().Total - info().Upload - info().Download
                              )
                            : "-"}
                        </span>
                        <span class={isExpired(info().Expire) ? "text-error font-medium" : ""}>
                          到期: {getExpireDate(info().Expire)}
                        </span>
                      </div>
                    </div>
                  )}
                </Show>
              </div>
            </div>
          )}
        </For>

        {/* Empty state */}
        <Show when={providers().length === 0}>
          <div class="card bg-base-100">
            <div class="text-center py-16">
              <div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-4">
                <Globe size={28} class="text-base-content/20" />
              </div>
              <p class="text-sm text-base-content/50 font-medium">暂无订阅源</p>
              <p class="text-xs text-base-content/30 mt-1 max-w-xs mx-auto">
                点击"导入订阅"粘贴你的机场订阅链接，自动生成配置
              </p>
              <button class="btn btn-primary btn-sm rounded-xl mt-4 gap-1.5" onClick={openModal}>
                <Plus size={14} />
                导入订阅
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* Import Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeModal}>
          <div
            class="card bg-base-100 w-full max-w-lg mx-4 shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div class="flex items-center justify-between p-4 border-b border-base-300">
              <div class="flex items-center gap-2">
                {step() === "input" ? (
                  <>
                    <Globe size={18} class="text-primary" />
                    <span class="font-medium">导入订阅</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown size={18} class="text-primary" />
                    <span class="font-medium">配置已生成</span>
                  </>
                )}
              </div>
              <button class="btn btn-ghost btn-xs btn-square" onClick={closeModal}>
                <span class="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Step 1: Input URL */}
            <Show when={step() === "input"}>
              <div class="p-4 space-y-4">
                <div class="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Info size={16} class="text-primary mt-0.5 flex-shrink-0" />
                  <p class="text-xs text-base-content/60 leading-relaxed">
                    粘贴机场面板中的订阅链接（支持 Clash/V2Ray/SS 等格式），系统将自动生成 proxy-provider 配置。
                  </p>
                </div>

                <div>
                  <label class="text-sm text-base-content/70 mb-1.5 block font-medium">
                    订阅链接
                  </label>
                  <input
                    type="url"
                    class="input input-bordered input-sm w-full rounded-xl font-mono text-sm"
                    placeholder="https://example.com/api/v1/client/subscribe?token=xxx"
                    value={formUrl()}
                    onInput={(e) => {
                      setFormUrl(e.currentTarget.value);
                      setError("");
                    }}
                  />
                </div>

                <div>
                  <label class="text-sm text-base-content/70 mb-1.5 block font-medium">
                    订阅名称
                    <span class="text-base-content/30 font-normal">（可选）</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered input-sm w-full rounded-xl"
                    placeholder="my-subscription"
                    value={formName()}
                    onInput={(e) => setFormName(e.currentTarget.value)}
                  />
                </div>

                <Show when={error()}>
                  <div class="flex items-center gap-2 text-error text-xs">
                    <AlertCircle size={14} />
                    {error()}
                  </div>
                </Show>

                <button class="btn btn-primary w-full rounded-xl" onClick={generateConfig}>
                  生成配置
                </button>
              </div>
            </Show>

            {/* Step 2: Generated Config */}
            <Show when={step() === "config"}>
              <div class="p-4 space-y-4">
                <div class="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/10">
                  <Info size={16} class="text-warning mt-0.5 flex-shrink-0" />
                  <p class="text-xs text-base-content/60 leading-relaxed">
                    将下方配置添加到 <code class="bg-base-200 px-1 rounded text-[11px]">config.yaml</code> 中，
                    然后到"配置"页面点击"重载配置"即可生效。
                  </p>
                </div>

                <div class="relative">
                  <pre class="mockup-code text-xs leading-relaxed max-h-[300px] overflow-y-auto rounded-xl">
                    <code class="text-base-content/80 whitespace-pre-wrap break-all">
                      {configText()}
                    </code>
                  </pre>
                  <button
                    class="absolute top-2 right-2 btn btn-ghost btn-xs btn-square bg-base-100/80 backdrop-blur-sm"
                    onClick={() => copyToClipboard(configText(), "config")}
                    title="复制"
                  >
                    {copied() === "config" ? (
                      <Check size={14} class="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                <div class="flex gap-2">
                  <button
                    class="btn btn-primary flex-1 rounded-xl gap-1.5"
                    onClick={() => copyToClipboard(configText(), "config")}
                  >
                    {copied() === "config" ? (
                      <>
                        <Check size={14} />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        复制配置
                      </>
                    )}
                  </button>
                  <button class="btn btn-ghost rounded-xl gap-1.5" onClick={downloadConfig}>
                    <Download size={14} />
                    下载
                  </button>
                </div>

                <button
                  class="btn btn-ghost btn-sm w-full rounded-xl"
                  onClick={() => setStep("input")}
                >
                  返回修改
                </button>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
