import { createSignal, For, Show, createMemo, onMount, onCleanup } from "solid-js";
import { useClashWs } from "../services/clash-ws";
import { useI18n } from "../i18n";
import type { LogEntry } from "../types/clash";

const MAX_LOGS = 500;

export default function Logs() {
  const { t } = useI18n();
  const ws = useClashWs();

  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [level, setLevel] = createSignal<string>("info");
  const [paused, setPaused] = createSignal(false);
  const [autoScroll, setAutoScroll] = createSignal(true);
  const [search, setSearch] = createSignal("");

  let logContainer: HTMLDivElement;
  let reconnectTimer: ReturnType<typeof setTimeout>;

  const filteredLogs = createMemo(() => {
    const filter = search().toLowerCase().trim();
    const list = logs();
    if (!filter) return list;
    return list.filter((log) => log.payload.toLowerCase().includes(filter));
  });

  const addLog = (entry: LogEntry) => {
    if (paused()) return;
    setLogs((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
    });
  };

  const getLevelColor = (type: string): string => {
    switch (type) {
      case "debug": return "var(--text-tertiary)";
      case "info": return "var(--text-secondary)";
      case "warning": return "var(--warning)";
      case "error": return "var(--error)";
      default: return "var(--text-secondary)";
    }
  };

  const getLevelBg = (type: string): string => {
    switch (type) {
      case "debug": return "rgba(100,116,139,0.1)";
      case "info": return "transparent";
      case "warning": return "rgba(245,158,11,0.05)";
      case "error": return "rgba(239,68,68,0.05)";
      default: return "transparent";
    }
  };

  const connectLogs = () => {
    ws.disconnectLogs();
    ws.connectLogs(level(), (data) => {
      try {
        const parsed = JSON.parse(data) as LogEntry;
        addLog(parsed);
      } catch { /* ignore */ }
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const changeLevel = (newLevel: string) => {
    setLevel(newLevel);
    clearLogs();
    connectLogs();
  };

  onMount(() => {
    connectLogs();
  });

  onCleanup(() => {
    ws.disconnectLogs();
  });

  return (
    <div class="flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div class="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Logs
          </h1>
          <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {logs().length} entries
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: paused() ? "var(--accent-muted)" : "var(--bg-tertiary)",
              color: paused() ? "var(--accent)" : "var(--text-secondary)",
            }}
            onClick={() => setPaused(!paused())}
          >
            {paused() ? "Resume" : "Pause"}
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
            }}
            onClick={clearLogs}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Controls */}
      <div class="flex items-center gap-3 flex-shrink-0">
        {/* Level Filter */}
        <div class="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
          {["debug", "info", "warning", "error"].map((l) => (
            <button
              class="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 capitalize"
              style={{
                background: level() === l ? "var(--bg-tertiary)" : "transparent",
                color: level() === l ? getLevelColor(l) : "var(--text-tertiary)",
              }}
              onClick={() => changeLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          class="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
          placeholder="Search logs..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />

        {/* Auto Scroll Toggle */}
        <button
          class="px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200"
          style={{
            background: autoScroll() ? "var(--accent-muted)" : "var(--bg-tertiary)",
            color: autoScroll() ? "var(--accent)" : "var(--text-tertiary)",
          }}
          onClick={() => setAutoScroll(!autoScroll())}
        >
          Auto Scroll
        </button>
      </div>

      {/* Log Content */}
      <div
        ref={(el) => (logContainer = el)}
        class="flex-1 overflow-y-auto rounded-xl font-mono text-xs p-3"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <For each={filteredLogs()}>
          {(log, index) => (
            <div
              class="flex items-start gap-2 py-0.5 px-1 rounded"
              style={{
                background: getLevelBg(log.type),
              }}
            >
              <span
                class="flex-shrink-0 w-12 text-right font-semibold uppercase"
                style={{ color: getLevelColor(log.type), "font-size": "10px" }}
              >
                {log.type.slice(0, 4)}
              </span>
              <span class="flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                {new Date().toLocaleTimeString("zh-CN", { hour12: false })}
              </span>
              <span class="flex-1 break-all" style={{ color: "var(--text-secondary)" }}>
                {log.payload}
              </span>
            </div>
          )}
        </For>
        <Show when={filteredLogs().length === 0}>
          <div class="flex items-center justify-center py-10" style={{ color: "var(--text-tertiary)" }}>
            No logs
          </div>
        </Show>
      </div>
    </div>
  );
}
