import { createSignal, createEffect, For, Show } from "solid-js";
import { Search, XCircle, Trash2 } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs } from "@/services/clash-ws";
import { formatBytes } from "@/utils/format";
import ripple from "@/components/ui/RippleEffect";

interface Connection {
  id: string;
  metadata: {
    host: string;
    network: string;
    process: string;
    remoteDestination: string;
    sni: string;
    type: string;
  };
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
}

const ROW_HEIGHT = 40; // 每行高度 (px)
const OVERSCAN = 10;   // 上下额外渲染的行数

export default function Connections() {
  const clash = useClashStore();
  const wsManager = useClashWs();
  const [connections, setConnections] = createSignal<Connection[]>([]);
  const [filter, setFilter] = createSignal("");
  const [sortKey, setSortKey] = createSignal<string>("");
  const [sortDir, setSortDir] = createSignal<1 | -1>(-1);
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(600);
  let scrollContainer: HTMLDivElement | undefined;

  createEffect(() => {
    if (!clash.connected()) return;
    wsManager.connectConnections((data) => {
      if (data.connections) {
        setConnections(
          data.connections
            .slice()
            .map((c: Record<string, unknown>) => ({
              ...c,
              metadata: {
                host: (c.metadata as Record<string, unknown>)?.host as string || (c.metadata as Record<string, unknown>)?.remoteDestination as string || "",
                network: (c.metadata as Record<string, unknown>)?.network as string || "",
                process: (c.metadata as Record<string, unknown>)?.process as string || "",
                remoteDestination: (c.metadata as Record<string, unknown>)?.remoteDestination as string || "",
                sni: (c.metadata as Record<string, unknown>)?.sni as string || "",
                type: (c.metadata as Record<string, unknown>)?.type as string || "",
              },
            } as Connection))
        );
      }
    });
    return () => wsManager.disconnectConnections();
  });

  const closeAll = async () => {
    try {
      await fetch(`${clash.baseUrl()}/connections`, {
        method: "DELETE",
        headers: clash.headers(),
      });
    } catch (e) { console.error(e) }
  };

  const closeOne = async (id: string) => {
    try {
      await fetch(`${clash.baseUrl()}/connections/${id}`, {
        method: "DELETE",
        headers: clash.headers(),
      });
    } catch (e) { console.error(e) }
  };

  const filtered = () => {
    let list = connections();
    const q = filter().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.metadata.host.toLowerCase().includes(q) ||
          c.metadata.process.toLowerCase().includes(q) ||
          c.rule.toLowerCase().includes(q) ||
          (c.chains || []).join(" ").toLowerCase().includes(q)
      );
    }

    const key = sortKey();
    if (key) {
      list = [...list].sort((a, b) => {
        let va: any, vb: any;
        if (key === "host") { va = a.metadata.host; vb = b.metadata.host; }
        else if (key === "download") { va = a.download; vb = b.download; }
        else if (key === "upload") { va = a.upload; vb = b.upload; }
        else if (key === "rule") { va = a.rule; vb = b.rule; }
        else { va = 0; vb = 0; }
        return va > vb ? sortDir() : va < vb ? -sortDir() : 0;
      });
    }
    return list;
  };

  const toggleSort = (key: string) => {
    if (sortKey() === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
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

  const updateViewport = () => {
    if (scrollContainer) {
      setViewportHeight(scrollContainer.clientHeight);
    }
  };

  return (
    <div class="animate-page-in-enhanced space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">连接</h1>
          <p class="text-sm text-base-content/50 mt-0.5">
            实时连接管理 · {connections().length} 个活跃连接
          </p>
        </div>
        <button use:ripple class="btn btn-error btn-sm btn-outline rounded-xl gap-1.5" onClick={closeAll}>
          <Trash2 size={14} />
          关闭全部
        </button>
      </div>

      {/* Filter */}
      <div class="relative">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          placeholder="按域名、进程、规则、链路过滤..."
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
          class="input input-bordered input-sm w-full max-w-lg rounded-xl pl-9 bg-base-100"
        />
      </div>

      {/* Virtual Table */}
      <div class="card bg-base-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="border-b border-base-300">
                <th class="text-xs font-medium text-base-content/50 cursor-pointer hover:text-base-content" onClick={() => toggleSort("host")}>
                  主机 {sortKey() === "host" && (sortDir() === -1 ? "↓" : "↑")}
                </th>
                <th class="text-xs font-medium text-base-content/50">网络</th>
                <th class="text-xs font-medium text-base-content/50">进程</th>
                <th class="text-xs font-medium text-base-content/50 cursor-pointer hover:text-base-content" onClick={() => toggleSort("rule")}>
                  规则 {sortKey() === "rule" && (sortDir() === -1 ? "↓" : "↑")}
                </th>
                <th class="text-xs font-medium text-base-content/50 cursor-pointer hover:text-base-content" onClick={() => toggleSort("download")}>
                  下载 {sortKey() === "download" && (sortDir() === -1 ? "↓" : "↑")}
                </th>
                <th class="text-xs font-medium text-base-content/50 cursor-pointer hover:text-base-content" onClick={() => toggleSort("upload")}>
                  上传 {sortKey() === "upload" && (sortDir() === -1 ? "↓" : "↑")}
                </th>
                <th class="text-xs font-medium text-base-content/50">链路</th>
                <th class="w-10"></th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtual scroll container */}
        <div
          ref={scrollContainer}
          class="overflow-y-auto"
          style={{ height: `calc(100vh - 360px)`, "min-height": "300px" }}
          onScroll={handleScroll}
          onResize={updateViewport}
        >
          <div style={{ height: `${virtualData().totalHeight}px`, position: "relative" }}>
            <div style={{ transform: `translateY(${virtualData().offsetY}px)` }}>
              <For each={virtualData().visibleItems}>
                {(conn) => (
                  <div
                    class="flex items-center gap-2 px-4 py-1.5 hover:bg-base-200/50 border-b border-base-200/50"
                    style={{ height: `${ROW_HEIGHT}px`, "box-sizing": "border-box" }}
                  >
                    <div class="font-mono text-xs max-w-[180px] truncate flex-1">{conn.metadata.host || conn.metadata.remoteDestination}</div>
                    <div class="w-14">
                      <span class={`badge badge-xs ${conn.metadata.network === "udp" ? "badge-warning" : "badge-info"}`}>
                        {conn.metadata.network?.toUpperCase()}
                      </span>
                    </div>
                    <div class="text-xs text-base-content/70 max-w-[100px] truncate w-24">{conn.metadata.process || "-"}</div>
                    <div class="text-xs max-w-[120px] truncate w-28">{conn.rule}</div>
                    <div class="text-xs text-primary font-mono w-20 text-right">{formatBytes(conn.download)}</div>
                    <div class="text-xs text-success font-mono w-20 text-right">{formatBytes(conn.upload)}</div>
                    <div class="text-[11px] text-base-content/40 max-w-[200px] truncate flex-1">{(conn.chains || []).join(" → ")}</div>
                    <div class="w-8">
                      <button class="btn btn-ghost btn-xs btn-square text-base-content/30 hover:text-error" onClick={() => closeOne(conn.id)}>
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        <Show when={filtered().length === 0}>
          <div class="text-center py-12 text-base-content/30">
            <p class="text-sm">暂无活跃连接</p>
          </div>
        </Show>
      </div>
    </div>
  );
}
