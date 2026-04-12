import { createSignal, onMount, onCleanup } from "solid-js";
import { useClashWs } from "../../services/clash-ws";
import { useClashStore } from "../../stores/clash";
import { useI18n } from "../../i18n";
import { formatSpeed, formatBytes, formatDuration } from "../../utils/format";

export function StatusBar() {
  const clash = useClashStore();
  const { t } = useI18n();
  const ws = useClashWs();

  const [uploadSpeed, setUploadSpeed] = createSignal(0);
  const [downloadSpeed, setDownloadSpeed] = createSignal(0);
  const [totalUpload, setTotalUpload] = createSignal(0);
  const [totalDownload, setTotalDownload] = createSignal(0);
  const [connectionCount, setConnectionCount] = createSignal(0);
  const [startTime, setStartTime] = createSignal(Date.now());
  const [uptime, setUptime] = createSignal(0);

  let uptimeInterval: ReturnType<typeof setInterval>;

  onMount(() => {
    // Connect traffic WebSocket
    ws.connectTraffic((data) => {
      setUploadSpeed(data.up);
      setDownloadSpeed(data.down);
      setTotalUpload((prev) => prev + data.up);
      setTotalDownload((prev) => prev + data.down);
    });

    // Uptime counter
    uptimeInterval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime()) / 1000));
    }, 1000);

    // Connect connections WebSocket for count
    ws.connectConnections((data) => {
      setConnectionCount(data.connections?.length || 0);
    });
  });

  onCleanup(() => {
    clearInterval(uptimeInterval);
    ws.disconnectAll();
  });

  return (
    <footer
      class="flex items-center justify-between h-7 px-4 text-xs select-none"
      style={{
        background: "var(--bg-secondary)",
        "border-top": "1px solid var(--border-default)",
        color: "var(--text-tertiary)",
      }}
    >
      {/* Left: Traffic */}
      <div class="flex items-center gap-5">
        {/* Upload */}
        <div class="flex items-center gap-1.5">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
          <span style={{ color: "var(--accent2)" }}>{formatSpeed(uploadSpeed())}</span>
        </div>
        {/* Download */}
        <div class="flex items-center gap-1.5">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <span style={{ color: "var(--accent)" }}>{formatSpeed(downloadSpeed())}</span>
        </div>
        {/* Total */}
        <div class="flex items-center gap-1.5">
          <span>
            {t().dashboard.upload}: {formatBytes(totalUpload())}
          </span>
          <span style={{ color: "var(--border-default)" }}>|</span>
          <span>
            {t().dashboard.download}: {formatBytes(totalDownload())}
          </span>
        </div>
      </div>

      {/* Right: Status */}
      <div class="flex items-center gap-5">
        {/* Connections */}
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
          <span>
            {t().dashboard.activeConnections}: {connectionCount()}
          </span>
        </div>
        {/* Uptime */}
        <div class="flex items-center gap-1.5">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formatDuration(uptime())}</span>
        </div>
        {/* Mode */}
        <div class="flex items-center gap-1.5">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              "text-transform": "uppercase",
            }}
          >
            {clash.config()?.mode || "rule"}
          </span>
        </div>
      </div>
    </footer>
  );
}
