import { createSignal, For, Show, onMount } from "solid-js";
import { useI18n } from "../i18n";
import { formatBytes, formatDate } from "../utils/format";

interface Subscription {
  id: string;
  name: string;
  url: string;
  lastUpdate?: string;
  nodeCount?: number;
  usedTraffic?: number;
  totalTraffic?: number;
  expire?: number;
  enabled: boolean;
}

export default function Subscriptions() {
  const { t } = useI18n();
  const [subscriptions, setSubscriptions] = createSignal<Subscription[]>([]);
  const [showAdd, setShowAdd] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newUrl, setNewUrl] = createSignal("");
  const [editing, setEditing] = createSignal<string | null>(null);

  const addSubscription = () => {
    if (!newName() || !newUrl()) return;
    const sub: Subscription = {
      id: Date.now().toString(),
      name: newName(),
      url: newUrl(),
      enabled: true,
    };
    setSubscriptions((prev) => [...prev, sub]);
    saveToStorage();
    setShowAdd(false);
    setNewName("");
    setNewUrl("");
  };

  const removeSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    saveToStorage();
  };

  const toggleSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    saveToStorage();
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem("hyperion-subscriptions", JSON.stringify(subscriptions()));
    } catch { /* ignore */ }
  };

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem("hyperion-subscriptions");
      if (saved) {
        setSubscriptions(JSON.parse(saved));
      }
    } catch { /* ignore */ }
  };

  const updateSubscription = async (sub: Subscription) => {
    // In a real implementation, this would fetch the subscription URL
    // and update the proxy list
    console.log("Update subscription:", sub.name);
  };

  const updateAll = async () => {
    for (const sub of subscriptions()) {
      if (sub.enabled) {
        await updateSubscription(sub);
      }
    }
  };

  onMount(loadFromStorage);

  return (
    <div class="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Subscriptions
          </h1>
          <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {subscriptions().length} subscriptions
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
            onClick={updateAll}
          >
            Update All
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid rgba(6,182,212,0.3)",
            }}
            onClick={() => setShowAdd(true)}
          >
            Add
          </button>
        </div>
      </div>

      {/* Add Subscription Modal */}
      <Show when={showAdd()}>
        <div class="p-4 rounded-xl neon-border" style={{ background: "var(--bg-secondary)" }}>
          <h3 class="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Add Subscription
          </h3>
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>
                Name
              </label>
              <input
                class="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                placeholder="My Subscription"
                value={newName()}
                onInput={(e) => setNewName(e.currentTarget.value)}
              />
            </div>
            <div>
              <label class="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>
                URL
              </label>
              <input
                class="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
                placeholder="https://example.com/subscribe?token=xxx"
                value={newUrl()}
                onInput={(e) => setNewUrl(e.currentTarget.value)}
              />
            </div>
            <div class="flex gap-2 justify-end">
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                }}
                onClick={addSubscription}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Subscription List */}
      <div class="flex flex-col gap-3">
        <For each={subscriptions()}>
          {(sub) => (
            <div
              class="p-4 rounded-xl neon-border transition-all duration-200"
              style={{
                background: sub.enabled ? "var(--bg-secondary)" : "var(--bg-secondary)",
                opacity: sub.enabled ? 1 : 0.6,
              }}
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {sub.name}
                    </span>
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        background: sub.enabled ? "var(--success-muted)" : "var(--bg-tertiary)",
                        color: sub.enabled ? "var(--success)" : "var(--text-tertiary)",
                      }}
                    >
                      {sub.enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div class="text-xs truncate font-mono" style={{ color: "var(--text-tertiary)" }}>
                    {sub.url}
                  </div>
                  {sub.lastUpdate && (
                    <div class="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                      Last update: {formatDate(sub.lastUpdate)}
                      {sub.nodeCount !== undefined && ` | ${sub.nodeCount} nodes`}
                    </div>
                  )}
                  {sub.totalTraffic !== undefined && sub.totalTraffic > 0 && (
                    <div class="flex items-center gap-3 mt-2">
                      <div class="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ((sub.usedTraffic || 0) / sub.totalTraffic) * 100)}%`,
                            background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                          }}
                        />
                      </div>
                      <span class="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {formatBytes(sub.usedTraffic || 0)} / {formatBytes(sub.totalTraffic)}
                      </span>
                    </div>
                  )}
                </div>
                <div class="flex items-center gap-1 ml-3">
                  <button
                    class="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150"
                    style={{ color: "var(--text-tertiary)" }}
                    onClick={() => toggleSubscription(sub.id)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      {sub.enabled ? (
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      ) : (
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      )}
                    </svg>
                  </button>
                  <button
                    class="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150"
                    style={{ color: "var(--accent)" }}
                    onClick={() => updateSubscription(sub)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--accent-muted)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                  <button
                    class="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150"
                    style={{ color: "var(--error)" }}
                    onClick={() => removeSubscription(sub.id)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--error-muted)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </For>

        <Show when={subscriptions().length === 0}>
          <div class="flex flex-col items-center justify-center py-20 rounded-xl" style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
          }}>
            <svg class="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <p class="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No subscriptions yet
            </p>
            <p class="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Click "Add" to add your first subscription
            </p>
          </div>
        </Show>
      </div>
    </div>
  );
}
