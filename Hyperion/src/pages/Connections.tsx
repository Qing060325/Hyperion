import { createSignal, For, Show, createMemo, onMount, onCleanup } from "solid-js";
import { clashApi } from "../services/clash-api";
import { useClashWs } from "../services/clash-ws";
import { useI18n } from "../i18n";
import type { ConnectionInfo } from "../types/clash";
import { formatBytes, formatSpeed, formatDuration, formatTime } from "../utils/format";
import { shorten } from "../utils/format";

export default function Connections() {
  const { t } = useI18n();
  const ws = useClashWs();

  const [connections, setConnections] = createSignal<ConnectionInfo[]>([]);
  const [filterText, setFilterText] = createSignal("");
  const [activeTab, setActiveTab] = createSignal<"active" | "closed">("active");
  const [closedConnections, setClosedConnections] = createSignal<ConnectionInfo[]>([]);
  const [sortKey, setSortKey] = createSignal<string>("start");
  const [sortAsc, setSortAsc] = createSignal(false);
  const [totalDown, setTotalDown] = createSignal(0);
  const [totalUp, setTotalUp] = createSignal(0);

  const filteredConnections = createMemo(() => {
    const list = activeTab() === "active" ? connections() : closedConnections();
    const filter = filterText().toLowerCase().trim();
    if (!filter) return list;

    return list.filter((conn) => {
      const meta = conn.metadata;
      return (
        conn.id.toLowerCase().includes(filter) ||
        meta.host?.toLowerCase().includes(filter) ||
        meta.destination_ip?.toLowerCase().includes(filter) ||
        meta.process?.toLowerCase().includes(filter) ||
        conn.rule.toLowerCase().includes(filter) ||
        conn.chains.some((c) => c.toLowerCase().includes(filter))
      );
    });
  });

  const sortedConnections = createMemo(() => {
    const list = [...filteredConnections()];
    const key = sortKey();
    const asc = sortAsc();

    list.sort((a, b) => {
      let valA: number | string, valB: number | string;

      switch (key) {
        case "host":
          valA = a.metadata.host || a.metadata.destination_ip || "";
          valB = b.metadata.host || b.metadata.destination_ip || "";
          break;
        case "process":
          valA = a.metadata.process || "";
          valB = b.metadata.process || "";
          break;
        case "rule":
          valA = a.rule;
          valB = b.rule;
          break;
        case "download":
          valA = a.download;
          valB = b.download;
          break;
        case "upload":
          valA = a.upload;
          valB = b.upload;
          break;
        default:
          valA = a.start;
          valB = b.start;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return asc ? valA - valB : valB - valA;
      }
      return asc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return list;
  });

  const closeConnection = async (id: string) => {
    try {
      await clashApi.closeConnection(id);
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Failed to close connection:", e);
    }
  };

  const closeAll = async () => {
    try {
      await clashApi.closeAllConnections();
      setConnections([]);
      setClosedConnections([]);
    } catch (e) {
      console.error("Failed to close all:", e);
    }
  };

  const toggleSort = (key: string) => {
    if (sortKey() === key) {
      setSortAsc(!sortAsc());
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  onMount(async () => {
    // Initial load
    try {
      const data = await clashApi.getConnections();
      setConnections(data.connections || []);
      setTotalDown(data.download_total);
      setTotalUp(data.upload_total);
    } catch (e) {
      console.error("Failed to load connections:", e);
    }

    // WebSocket for real-time updates
    ws.connectConnections((data) => {
      if (data.connections) {
        setConnections(data.connections);
      }
      setTotalDown(data.download_total);
      setTotalUp(data.upload_total);
    });
  });

  return (
    <div class="flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div class="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Connections
          </h1>
          <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Active: {connections().length} | Total ↑ {formatBytes(totalUp())} ↓ {formatBytes(totalDown())}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "var(--error-muted)",
              color: "var(--error)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
            onClick={closeAll}
          >
            Close All
          </button>
        </div>
      </div>

      {/* Filter */}
      <div class="flex-shrink-0">
        <input
          class="w-full px-3 py-2 rounded-lg text-xs outline-none"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
          placeholder="Filter by host, process, rule..."
          value={filterText()}
          onInput={(e) => setFilterText(e.currentTarget.value)}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
          }}
        />
      </div>

      {/* Connections Table */}
      <div class="flex-1 overflow-auto rounded-xl" style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
      }}>
        <table class="w-full text-xs">
          <thead>
            <tr style={{ "border-bottom": "1px solid var(--border-default)" }}>
              {[
                { key: "host", label: "Host" },
                { key: "process", label: "Process" },
                { key: "rule", label: "Rule" },
                { key: "download", label: "Download" },
                { key: "upload", label: "Upload" },
                { key: "", label: "Chain" },
              ].map((col) => (
                <th
                  class="px-3 py-2.5 text-left font-medium cursor-pointer select-none"
                  style={{ color: "var(--text-tertiary)" }}
                  onClick={() => col.key && toggleSort(col.key)}
                >
                  <span class="flex items-center gap-1">
                    {col.label}
                    {sortKey() === col.key && (
                      <span style={{ color: "var(--accent)" }}>
                        {sortAsc() ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              <th class="px-3 py-2.5 text-right font-medium" style={{ color: "var(--text-tertiary)" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={sortedConnections()}>
              {(conn) => (
                <tr
                  class="transition-colors duration-150"
                  style={{
                    "border-bottom": "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <td class="px-3 py-2" style={{ color: "var(--text-primary)", "max-width": "200px" }}>
                    <div class="truncate" title={conn.metadata.host || conn.metadata.destination_ip}>
                      {conn.metadata.host || conn.metadata.destination_ip || "---"}
                    </div>
                    <div class="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {conn.metadata.network?.toUpperCase()} :{conn.metadata.destination_port}
                    </div>
                  </td>
                  <td class="px-3 py-2" style={{ color: "var(--text-secondary)", "max-width": "120px" }}>
                    <div class="truncate" title={conn.metadata.process || ""}>
                      {conn.metadata.process || "---"}
                    </div>
                    <div class="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {conn.metadata.source_ip}:{conn.metadata.source_port}
                    </div>
                  </td>
                  <td class="px-3 py-2" style={{ color: "var(--text-secondary)", "max-width": "120px" }}>
                    <div class="truncate" title={conn.rule}>
                      {conn.rule}
                    </div>
                    <div class="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {shorten(conn.rule_payload, 15)}
                    </div>
                  </td>
                  <td class="px-3 py-2 font-mono" style={{ color: "var(--accent)" }}>
                    {formatBytes(conn.download)}
                    <div class="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {conn.curDownload ? formatSpeed(conn.curDownload) : ""}
                    </div>
                  </td>
                  <td class="px-3 py-2 font-mono" style={{ color: "var(--accent2)" }}>
                    {formatBytes(conn.upload)}
                    <div class="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {conn.curUpload ? formatSpeed(conn.curUpload) : ""}
                    </div>
                  </td>
                  <td class="px-3 py-2" style={{ color: "var(--text-tertiary)", "max-width": "150px" }}>
                    <div class="truncate" title={conn.chains.join(" → ")}>
                      {conn.chains.join(" → ")}
                    </div>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button
                      class="px-2 py-1 rounded text-[10px] font-medium transition-colors duration-150"
                      style={{
                        background: "var(--error-muted)",
                        color: "var(--error)",
                      }}
                      onClick={() => closeConnection(conn.id)}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <Show when={sortedConnections().length === 0}>
          <div class="flex items-center justify-center py-10 text-xs" style={{ color: "var(--text-tertiary)" }}>
            No connections
          </div>
        </Show>
      </div>
    </div>
  );
}
