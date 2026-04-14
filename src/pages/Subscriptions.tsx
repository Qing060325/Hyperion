import { createSignal, createEffect, For, Show, onMount } from "solid-js";
import {
  Plus,
  RefreshCw,
  Trash2,
  Globe,
  AlertCircle,
  Check,
  X,
  Download,
  Upload,
  Clock,
  Server,
  RefreshCcw,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { formatBytes } from "@/utils/format";

// 订阅信息接口
interface SubscriptionInfo {
  name: string;
  url: string;
  interval: number;
  auto_update: boolean;
  last_update: string;
  node_count: number;
  upload: number;
  download: number;
  total: number;
  expire: number;
  used: number;
  remaining: number;
  usage_percent: number;
}

export default function Subscriptions() {
  const clash = useClashStore();
  const [subscriptions, setSubscriptions] = createSignal<SubscriptionInfo[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [updating, setUpdating] = createSignal<string | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [error, setError] = createSignal("");

  // 表单状态
  const [formName, setFormName] = createSignal("");
  const [formUrl, setFormUrl] = createSignal("");
  const [formInterval, setFormInterval] = createSignal(3600);
  const [formAutoUpdate, setFormAutoUpdate] = createSignal(true);

  // 获取订阅列表
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${clash.baseUrl()}/subscriptions`, {
        headers: clash.headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (e) {
      console.error("获取订阅失败:", e);
    }
    setLoading(false);
  };

  // 更新单个订阅
  const updateSubscription = async (name: string) => {
    setUpdating(name);
    try {
      const res = await fetch(`${clash.baseUrl()}/subscriptions/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: clash.headers(),
      });
      if (res.ok) {
        setTimeout(fetchSubscriptions, 1000);
      }
    } catch (e) {
      console.error("更新订阅失败:", e);
    }
    setUpdating(null);
  };

  // 更新所有订阅
  const updateAllSubscriptions = async () => {
    setUpdating("all");
    try {
      const res = await fetch(`${clash.baseUrl()}/subscriptions`, {
        method: "POST",
        headers: clash.headers(),
      });
      if (res.ok) {
        setTimeout(fetchSubscriptions, 1000);
      }
    } catch (e) {
      console.error("更新所有订阅失败:", e);
    }
    setUpdating(null);
  };

  // 添加订阅（通过配置）
  const addSubscription = () => {
    const name = formName().trim();
    const url = formUrl().trim();

    if (!name || !url) {
      setError("请填写订阅名称和链接");
      return;
    }

    // 生成配置文本
    const config = `subscriptions:
  - name: "${name}"
    url: "${url}"
    interval: ${formInterval()}
    auto-update: ${formAutoUpdate()}`;

    // 复制到剪贴板
    navigator.clipboard.writeText(config);

    // 关闭弹窗
    setShowAddModal(false);
    setFormName("");
    setFormUrl("");
    setError("");

    // 提示用户
    alert("订阅配置已复制到剪贴板，请添加到 config.yaml 文件中");
  };

  // 格式化过期时间
  const formatExpire = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return "永久有效";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) return "已过期";
    if (days === 0) return "今天过期";
    if (days <= 7) return `${days}天后过期`;
    return date.toLocaleDateString("zh-CN");
  };

  // 获取流量使用颜色
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "text-error";
    if (percent >= 70) return "text-warning";
    return "text-success";
  };

  // 获取进度条颜色
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-error";
    if (percent >= 70) return "bg-warning";
    return "bg-success";
  };

  onMount(() => {
    if (clash.connected()) {
      fetchSubscriptions();
    }
  });

  createEffect(() => {
    if (clash.connected()) {
      fetchSubscriptions();
    }
  });

  return (
    <div class="p-6 max-w-7xl mx-auto">
      {/* 头部 */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">订阅管理</h1>
          <p class="text-base-content/60 mt-1">
            管理代理订阅，自动更新节点配置
          </p>
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-outline btn-sm"
            onClick={updateAllSubscriptions}
            disabled={updating() === "all"}
          >
            <RefreshCcw class="w-4 h-4 mr-1" />
            {updating() === "all" ? "更新中..." : "更新全部"}
          </button>
          <button
            class="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus class="w-4 h-4 mr-1" />
            添加订阅
          </button>
        </div>
      </div>

      {/* 订阅列表 */}
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center justify-center py-20">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        }
      >
        <Show
          when={subscriptions().length > 0}
          fallback={
            <div class="text-center py-20">
              <Globe class="w-16 h-16 mx-auto mb-4 text-base-content/30" />
              <h3 class="text-lg font-medium mb-2">暂无订阅</h3>
              <p class="text-base-content/60 mb-4">
                添加订阅链接，自动获取代理节点
              </p>
              <button
                class="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus class="w-4 h-4 mr-1" />
                添加订阅
              </button>
            </div>
          }
        >
          <div class="grid gap-4">
            <For each={subscriptions()}>
              {(sub) => (
                <div class="card bg-base-100 shadow-sm border border-base-200">
                  <div class="card-body">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        {/* 标题行 */}
                        <div class="flex items-center gap-3 mb-3">
                          <h3 class="text-lg font-semibold">{sub.name}</h3>
                          <Show when={sub.auto_update}>
                            <span class="badge badge-primary badge-sm">自动更新</span>
                          </Show>
                          <span class="badge badge-ghost badge-sm">
                            <Server class="w-3 h-3 mr-1" />
                            {sub.node_count} 节点
                          </span>
                        </div>

                        {/* URL */}
                        <div class="text-sm text-base-content/60 mb-4 truncate max-w-2xl">
                          {sub.url}
                        </div>

                        {/* 流量信息 */}
                        <Show when={sub.total > 0}>
                          <div class="bg-base-200 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between mb-2">
                              <span class="text-sm font-medium">流量使用</span>
                              <span class={`text-sm font-bold ${getUsageColor(sub.usage_percent)}`}>
                                {sub.usage_percent.toFixed(1)}%
                              </span>
                            </div>

                            {/* 进度条 */}
                            <div class="w-full bg-base-300 rounded-full h-2 mb-3">
                              <div
                                class={`h-2 rounded-full transition-all ${getProgressColor(sub.usage_percent)}`}
                                style={{ width: `${Math.min(sub.usage_percent, 100)}%` }}
                              />
                            </div>

                            {/* 流量详情 */}
                            <div class="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div class="text-base-content/60 flex items-center gap-1">
                                  <Download class="w-3 h-3" />
                                  下载
                                </div>
                                <div class="font-medium">{formatBytes(sub.download)}</div>
                              </div>
                              <div>
                                <div class="text-base-content/60 flex items-center gap-1">
                                  <Upload class="w-3 h-3" />
                                  上传
                                </div>
                                <div class="font-medium">{formatBytes(sub.upload)}</div>
                              </div>
                              <div>
                                <div class="text-base-content/60 flex items-center gap-1">
                                  <Clock class="w-3 h-3" />
                                  剩余
                                </div>
                                <div class="font-medium">{formatBytes(sub.remaining)}</div>
                              </div>
                            </div>
                          </div>
                        </Show>

                        {/* 底部信息 */}
                        <div class="flex items-center gap-4 text-sm text-base-content/60">
                          <span>
                            更新间隔: {Math.floor(sub.interval / 60)} 分钟
                          </span>
                          <span>
                            上次更新: {sub.last_update
                              ? new Date(sub.last_update).toLocaleString("zh-CN")
                              : "从未"}
                          </span>
                          <Show when={sub.expire > 0}>
                            <span class={sub.expire * 1000 < Date.now() ? "text-error" : ""}>
                              到期: {formatExpire(sub.expire)}
                            </span>
                          </Show>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div class="flex flex-col gap-2 ml-4">
                        <button
                          class="btn btn-sm btn-outline"
                          onClick={() => updateSubscription(sub.name)}
                          disabled={updating() === sub.name}
                        >
                          <RefreshCw
                            class={`w-4 h-4 ${updating() === sub.name ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* 添加订阅弹窗 */}
      <Show when={showAddModal()}>
        <div class="modal modal-open">
          <div class="modal-box max-w-lg">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold">添加订阅</h3>
              <button
                class="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowAddModal(false)}
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <Show when={error()}>
              <div class="alert alert-error mb-4">
                <AlertCircle class="w-4 h-4" />
                <span>{error()}</span>
              </div>
            </Show>

            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">订阅名称</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered"
                  placeholder="例如: 我的机场"
                  value={formName()}
                  onInput={(e) => setFormName(e.currentTarget.value)}
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">订阅链接</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered"
                  placeholder="https://example.com/subscribe?token=xxx"
                  value={formUrl()}
                  onInput={(e) => setFormUrl(e.currentTarget.value)}
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">更新间隔（分钟）</span>
                </label>
                <input
                  type="number"
                  class="input input-bordered"
                  value={formInterval() / 60}
                  onInput={(e) => setFormInterval(parseInt(e.currentTarget.value) * 60)}
                  min="10"
                />
              </div>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">自动更新</span>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    checked={formAutoUpdate()}
                    onChange={(e) => setFormAutoUpdate(e.currentTarget.checked)}
                  />
                </label>
              </div>

              <div class="alert alert-info text-sm">
                <Info class="w-4 h-4" />
                <span>
                  订阅配置将复制到剪贴板，请手动添加到 config.yaml 文件中
                </span>
              </div>
            </div>

            <div class="modal-action">
              <button class="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button class="btn btn-primary" onClick={addSubscription}>
                <Check class="w-4 h-4 mr-1" />
                复制配置
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
