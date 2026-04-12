import { createSignal, createEffect, For, Show, onCleanup } from "solid-js";
import { Search, Pause, Play, Trash2, ArrowDown } from "lucide-solid";
import { useClashStore } from "@/stores/clash";

interface LogEntry {
  type: string;
  payload: string;
}

const levelColors: Record<string, string> = {
  debug: "badge-ghost",
  info: "badge-info",
  warning: "badge-warning",
  error: "badge-error",
};

export default function Logs() {
  const clash = useClashStore();
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [level, setLevel] = createSignal<string>("");
  const [search, setSearch] = createSignal("");
  const [paused, setPaused] = createSignal(false);
  const [autoScroll, setAutoScroll] = createSignal(true);
  const [maxLogs] = createSignal(500);
  let ws: WebSocket | null = null;
  let logContainer: HTMLDivElement | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout>;

  createEffect(() => {
    if (!clash.connected()) return;
    connectWs();
    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  });

  const connectWs = () => {
    try {
      const token = clash.token();
      const params = new URLSearchParams();
      if (token) params.set("token", token);
      if (level()) params.set("level", level());
      ws = new WebSocket(`${clash.wsUrl()}/logs?${params}`);

      ws.onmessage = (e) => {
        if (paused()) return;
        try {
          const data = JSON.parse(e.data) as LogEntry;
          setLogs((prev) => {
            const next = [...prev, data];
            return next.length > maxLogs() ? next.slice(-maxLogs()) : next;
          });
          if (autoScroll() && logContainer) {
            requestAnimationFrame(() => {
              if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
            });
          }
        } catch {}
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWs, 3000);
      };
    } catch {
      reconnectTimer = setTimeout(connectWs, 3000);
    }
  };

  const filtered = () => {
    const q = search().toLowerCase();
    if (!q) return logs();
    return logs().filter((l) => l.payload.toLowerCase().includes(q));
  };

  return (
    <div class="animate-page-in space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">日志</h1>
        <p class="text-sm text-base-content/50 mt-0.5">Clash Meta 实时日志流</p>
      </div>

      {/* Controls */}
      <div class="flex items-center gap-2 flex-wrap">
        <div class="join">
          {(["", "debug", "info", "warning", "error"] as const).map((l) => (
            <button
              class={`btn btn-sm join-item rounded-none ${!l && !level() ? "btn-primary" : level() === l ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setLevel(l);
                setLogs([]);
                if (ws) ws.close();
                connectWs();
              }}
            >
              {l ? l.charAt(0).toUpperCase() + l.slice(1) : "全部"}
            </button>
          ))}
        </div>

        <div class="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="搜索日志..."
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            class="input input-bordered input-sm w-full rounded-xl pl-9 bg-base-100"
          />
        </div>

        <div class="flex items-center gap-1">
          <button
            class={`btn btn-sm btn-square rounded-xl ${autoScroll() ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setAutoScroll(!autoScroll())}
            title="自动滚动"
          >
            <ArrowDown size={14} />
          </button>
          <button
            class={`btn btn-sm btn-square rounded-xl ${paused() ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setPaused(!paused())}
            title={paused() ? "继续" : "暂停"}
          >
            {paused() ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button class="btn btn-sm btn-square rounded-xl btn-ghost" onClick={() => setLogs([])} title="清空">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Log Output */}
      <div
        ref={logContainer}
        class="card bg-base-100 overflow-hidden"
        style={{ height: "calc(100vh - 240px)", "min-height": "300px" }}
      >
        <div class="h-full overflow-y-auto p-2 font-mono text-xs leading-relaxed">
          <For each={filtered()}>
            {(log) => (
              <div class="flex items-start gap-2 px-2 py-0.5 rounded hover:bg-base-200/30">
                <span class={`badge badge-xs ${levelColors[log.type] || "badge-ghost"} mt-0.5 flex-shrink-0`}>
                  {log.type.slice(0, 4)}
                </span>
                <span class="text-base-content/70 whitespace-pre-wrap break-all">{log.payload}</span>
              </div>
            )}
          </For>
          <Show when={filtered().length === 0}>
            <div class="text-center py-8 text-base-content/30">
              <p>等待日志输出...</p>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
