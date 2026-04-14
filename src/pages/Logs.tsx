import { createSignal, createEffect, For, Show } from "solid-js";
import { Search, Pause, Play, Trash2, ArrowDown } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs } from "@/services/clash-ws";
import ripple from "@/components/ui/RippleEffect";

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

const ROW_HEIGHT = 26;   // 每行高度 (px)
const OVERSCAN = 20;     // 上下额外渲染行数（日志通常滚动很快）
const MAX_LOGS = 5000;   // 最大日志条数（比原来 500 大 10 倍，虚拟列表不卡）

export default function Logs() {
  const clash = useClashStore();
  const wsManager = useClashWs();
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [level, setLevel] = createSignal<string>("");
  const [search, setSearch] = createSignal("");
  const [paused, setPaused] = createSignal(false);
  const [autoScroll, setAutoScroll] = createSignal(true);
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(400);
  let scrollContainer: HTMLDivElement | undefined;

  createEffect(() => {
    if (!clash.connected()) return;
    connectWs();
    return () => wsManager.disconnectLogs();
  });

  const connectWs = () => {
    wsManager.connectLogs(level(), (data) => {
      if (paused()) return;
      const entry = data as LogEntry;
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
      // 自动滚动到底部
      if (autoScroll() && scrollContainer) {
        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        });
      }
    });
  };

  const filtered = () => {
    const q = search().toLowerCase();
    if (!q) return logs();
    return logs().filter((l) => l.payload.toLowerCase().includes(q));
  };

  // 虚拟滚动计算
  const virtualData = () => {
    const items = filtered();
    const totalHeight = items.length * ROW_HEIGHT;
    const st = scrollTop();
    const vh = viewportHeight();

    const startIndex = Math.max(0, Math.floor(st / ROW_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(
      items.length,
      Math.ceil((st + vh) / ROW_HEIGHT) + OVERSCAN
    );

    const visibleItems = items.slice(startIndex, endIndex);

    return {
      totalHeight,
      startIndex,
      endIndex,
      visibleItems,
      offsetY: startIndex * ROW_HEIGHT,
    };
  };

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  };

  return (
    <div class="animate-page-in-enhanced space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">日志</h1>
        <p class="text-sm text-base-content/50 mt-0.5">Hades 实时日志流 · {logs().length} 条</p>
      </div>

      {/* Controls */}
      <div class="flex items-center gap-2 flex-wrap">
        <div class="join">
          {(["", "debug", "info", "warning", "error"] as const).map((l) => (
            <button
              class={`btn btn-sm join-item rounded-none ${!l && !level() ? "btn-primary" : level() === l ? "btn-primary" : "btn-ghost"}`}
              use:ripple
              onClick={() => {
                setLevel(l);
                setLogs([]);
                wsManager.disconnectLogs();
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
            use:ripple
            onClick={() => setAutoScroll(!autoScroll())}
            title="自动滚动"
          >
            <ArrowDown size={14} />
          </button>
          <button
            class={`btn btn-sm btn-square rounded-xl ${paused() ? "btn-primary" : "btn-ghost"}`}
            use:ripple
            onClick={() => setPaused(!paused())}
            title={paused() ? "继续" : "暂停"}
          >
            {paused() ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button use:ripple class="btn btn-sm btn-square rounded-xl btn-ghost" onClick={() => setLogs([])} title="清空">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Virtual Log Output */}
      <div
        ref={scrollContainer}
        class="card bg-base-100 overflow-hidden"
        style={{ height: "calc(100vh - 240px)", "min-height": "300px" }}
        onScroll={handleScroll}
      >
        <div
          class="font-mono text-xs leading-relaxed"
          style={{
            height: `${virtualData().totalHeight}px`,
            position: "relative",
            padding: "8px",
          }}
        >
          <div style={{ transform: `translateY(${virtualData().offsetY}px)` }}>
            <For each={virtualData().visibleItems}>
              {(log) => (
                <div
                  class="flex items-start gap-2 px-2 rounded hover:bg-base-200/30"
                  style={{ height: `${ROW_HEIGHT}px`, "box-sizing": "border-box" }}
                >
                  <span class={`badge badge-xs ${levelColors[log.type] || "badge-ghost"} mt-0.5 flex-shrink-0`}>
                    {log.type.slice(0, 4)}
                  </span>
                  <span class="text-base-content/70 whitespace-pre-wrap break-all overflow-hidden">
                    {log.payload}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>

        <Show when={filtered().length === 0}>
          <div class="text-center py-8 text-base-content/30 absolute inset-0 flex items-center justify-center">
            <p>等待日志输出...</p>
          </div>
        </Show>
      </div>
    </div>
  );
}
