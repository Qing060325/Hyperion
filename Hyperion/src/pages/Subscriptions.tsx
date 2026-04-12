import { createSignal, createEffect, For, Show } from "solid-js";
import { Plus, Pencil, Trash2 } from "lucide-solid";

interface Subscription {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  info?: {
    Upload: number;
    Download: number;
    Total: number;
    Expire: number;
  };
}

export default function Subscriptions() {
  const [subs, setSubs] = createSignal<Subscription[]>([]);
  const [showModal, setShowModal] = createSignal(false);
  const [editing, setEditing] = createSignal<Subscription | null>(null);
  const [formName, setFormName] = createSignal("");
  const [formUrl, setFormUrl] = createSignal("");

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormUrl("");
    setShowModal(true);
  };

  const openEdit = (sub: Subscription) => {
    setEditing(sub);
    setFormName(sub.name);
    setFormUrl(sub.url);
    setShowModal(true);
  };

  const saveSub = () => {
    if (!formName() || !formUrl()) return;
    if (editing()) {
      setSubs((prev) =>
        prev.map((s) => (s.id === editing()!.id ? { ...s, name: formName(), url: formUrl() } : s))
      );
    } else {
      setSubs((prev) => [
        ...prev,
        { id: Date.now().toString(), name: formName(), url: formUrl(), enabled: true },
      ]);
    }
    setShowModal(false);
  };

  const deleteSub = (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSub = (id: string) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getTrafficPercent = (sub: Subscription) => {
    if (!sub.info?.Total) return 0;
    return Math.min(100, ((sub.info.Upload + sub.info.Download) / sub.info.Total) * 100);
  };

  return (
    <div class="animate-page-in space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">订阅</h1>
          <p class="text-sm text-base-content/50 mt-0.5">管理订阅链接和流量</p>
        </div>
        <button class="btn btn-primary btn-sm rounded-xl gap-1.5" onClick={openAdd}>
          <Plus size={14} />
          添加订阅
        </button>
      </div>

      {/* Subscriptions */}
      <div class="space-y-3">
        <For each={subs()}>
          {(sub, i) => (
            <div class="card bg-base-100 animate-card-in" style={{ "animation-delay": `${i() * 60}ms` }}>
              <div class="p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <span class="font-medium">{sub.name}</span>
                    <span class={`badge badge-sm ${sub.enabled ? "badge-success" : "badge-ghost"}`}>
                      {sub.enabled ? "启用" : "禁用"}
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button class="btn btn-ghost btn-xs btn-square" onClick={() => openEdit(sub)}>
                      <Pencil size={14} />
                    </button>
                    <button class="btn btn-ghost btn-xs btn-square text-error" onClick={() => deleteSub(sub.id)}>
                      <Trash2 size={14} />
                    </button>
                    <label class="toggle toggle-sm toggle-primary ml-1">
                      <input type="checkbox" checked={sub.enabled} onChange={() => toggleSub(sub.id)} />
                    </label>
                  </div>
                </div>

                <div class="text-xs text-base-content/40 font-mono truncate mb-3">{sub.url}</div>

                <Show when={sub.info}>
                  <div>
                    <div class="flex justify-between text-xs text-base-content/50 mb-1">
                      <span>已用 {formatBytes(sub.info!.Upload + sub.info!.Download)}</span>
                      <span>总计 {formatBytes(sub.info!.Total)}</span>
                    </div>
                    <progress class="progress progress-primary w-full h-1.5" value={getTrafficPercent(sub)} max="100" />
                  </div>
                </Show>
              </div>
            </div>
          )}
        </For>

        <Show when={subs().length === 0}>
          <div class="card bg-base-100">
            <div class="text-center py-12 text-base-content/30">
              <p class="text-sm">暂无订阅</p>
              <p class="text-xs mt-1">点击上方按钮添加订阅链接</p>
            </div>
          </div>
        </Show>
      </div>

      {/* Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div class="card bg-base-100 w-full max-w-md mx-4 shadow-xl animate-scale-in">
            <div class="p-4 border-b border-base-300">
              <span class="font-medium">{editing() ? "编辑订阅" : "添加订阅"}</span>
            </div>
            <div class="p-4 space-y-3">
              <div>
                <label class="text-sm text-base-content/60 mb-1 block">名称</label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full rounded-xl"
                  placeholder="订阅名称"
                  value={formName()}
                  onInput={(e) => setFormName(e.currentTarget.value)}
                />
              </div>
              <div>
                <label class="text-sm text-base-content/60 mb-1 block">链接</label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full rounded-xl"
                  placeholder="订阅 URL"
                  value={formUrl()}
                  onInput={(e) => setFormUrl(e.currentTarget.value)}
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 p-4 border-t border-base-300">
              <button class="btn btn-sm btn-ghost rounded-xl" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button class="btn btn-sm btn-primary rounded-xl" onClick={saveSub}>
                保存
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
