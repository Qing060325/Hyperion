import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { useClashStore } from "../stores/clash";
import { useClashWs } from "../services/clash-ws";
import { clashApi } from "../services/clash-api";
import { useI18n } from "../i18n";
import { formatBytes, formatSpeed } from "../utils/format";
import { getDelayColor, formatDelay } from "../utils/color";

// ==========================================
// Stat Card Component
// ==========================================
function StatCard(props: {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}) {
  return (
    <div
      class="p-4 rounded-xl transition-all duration-300 neon-border"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {props.label}
        </span>
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${props.color || "var(--accent)"}15`,
            color: props.color || "var(--accent)",
          }}
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d={props.icon} />
          </svg>
        </div>
      </div>
      <div class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        {props.value}
      </div>
      {props.subValue && (
        <div class="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          {props.subValue}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Traffic Chart (Canvas)
// ==========================================
function TrafficChart() {
  let canvasRef: HTMLCanvasElement;
  const maxPoints = 60;
  const uploadData = createSignal<number[]>(Array(maxPoints).fill(0));
  const downloadData = createSignal<number[]>(Array(maxPoints).fill(0));
  const ws = useClashWs();

  onMount(() => {
    const ctx = canvasRef.getContext("2d");
    let animFrame: number;

    const draw = () => {
      if (!ctx) return;
      const { width, height } = canvasRef;
      ctx.clearRect(0, 0, width, height);

      const upArr = uploadData[0]();
      const downArr = downloadData[0]();

      // Find max value for scaling
      const maxVal = Math.max(
        1,
        ...upArr,
        ...downArr
      );

      // Draw upload line (purple)
      drawLine(ctx, upArr, width, height, maxVal, "#8b5cf6", "rgba(139,92,246,0.1)");
      // Draw download line (cyan)
      drawLine(ctx, downArr, width, height, maxVal, "#06b6d4", "rgba(6,182,212,0.1)");

      animFrame = requestAnimationFrame(draw);
    };

    const drawLine = (
      ctx: CanvasRenderingContext2D,
      data: number[],
      width: number,
      height: number,
      maxVal: number,
      color: string,
      fillColor: string
    ) => {
      const stepX = width / (data.length - 1);

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < data.length; i++) {
        const x = i * stepX;
        const y = height - (data[i] / maxVal) * (height - 20) - 10;
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = (i - 1) * stepX;
          const prevY = height - (data[i - 1] / maxVal) * (height - 20) - 10;
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw the line on top
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = i * stepX;
        const y = height - (data[i] / maxVal) * (height - 20) - 10;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (i - 1) * stepX;
          const prevY = height - (data[i - 1] / maxVal) * (height - 20) - 10;
          const cpX = (prevX + x) / 2;
          ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Push traffic data every second
    const pushData = () => {
      const newUp = [...uploadData[0]().slice(1), currentUp];
      const newDown = [...downloadData[0]().slice(1), currentDown];
      uploadData[1](newUp);
      downloadData[1](newDown);
    };

    let currentUp = 0;
    let currentDown = 0;
    const dataInterval = setInterval(pushData, 1000);

    ws.connectTraffic((data) => {
      currentUp = data.up;
      currentDown = data.down;
    });

    draw();

    onCleanup(() => {
      cancelAnimationFrame(animFrame);
      clearInterval(dataInterval);
    });
  });

  return (
    <div class="rounded-xl p-4 neon-border" style={{ background: "var(--bg-secondary)" }}>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Traffic Trend
        </h3>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-0.5 rounded" style={{ background: "var(--accent)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Download</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-0.5 rounded" style={{ background: "var(--accent2)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Upload</span>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef!}
        style={{ width: "100%", height: "200px" }}
      />
    </div>
  );
}

// ==========================================
// Mode Switcher
// ==========================================
function ModeSwitcher() {
  const clash = useClashStore();
  const { t } = useI18n();
  const [currentMode, setCurrentMode] = createSignal("rule");

  const modes = [
    { key: "rule", label: "Rule" },
    { key: "global", label: "Global" },
    { key: "direct", label: "Direct" },
  ];

  const switchMode = async (mode: string) => {
    try {
      await clashApi.patchConfig({ mode: mode as "rule" | "global" | "direct" });
      setCurrentMode(mode);
      clash.setConfig((prev) => prev ? { ...prev, mode: mode as "rule" | "global" | "direct" } : prev);
    } catch (e) {
      console.error("Failed to switch mode:", e);
    }
  };

  return (
    <div
      class="p-4 rounded-xl neon-border"
      style={{ background: "var(--bg-secondary)" }}
    >
      <h3 class="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
        Mode
      </h3>
      <div class="flex gap-2">
        {modes.map((mode) => (
          <button
            class="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: currentMode() === mode.key ? "var(--accent-muted)" : "var(--bg-tertiary)",
              color: currentMode() === mode.key ? "var(--accent)" : "var(--text-secondary)",
              border: currentMode() === mode.key ? "1px solid rgba(6,182,212,0.3)" : "1px solid transparent",
            }}
            onClick={() => switchMode(mode.key)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Dashboard Page
// ==========================================
export default function Dashboard() {
  const clash = useClashStore();
  const { t } = useI18n();

  const [totalUp, setTotalUp] = createSignal(0);
  const [totalDown, setTotalDown] = createSignal(0);
  const [connCount, setConnCount] = createSignal(0);
  const [upSpeed, setUpSpeed] = createSignal(0);
  const [downSpeed, setDownSpeed] = createSignal(0);
  const [memory, setMemory] = createSignal(0);
  const [startTime, setStartTime] = createSignal(Date.now());
  const [uptime, setUptime] = createSignal(0);

  let uptimeTimer: ReturnType<typeof setInterval>;

  onMount(() => {
    // Fetch initial data
    clashApi.getConnections().then((data) => {
      setTotalUp(data.upload_total);
      setTotalDown(data.download_total);
      setConnCount(data.connections?.length || 0);
      setMemory(data.memory || 0);
    });

    // Uptime timer
    uptimeTimer = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime()) / 1000));
    }, 1000);

    // Set initial mode
    if (clash.config()?.mode) {
      // mode is set via clash store
    }
  });

  onCleanup(() => {
    clearInterval(uptimeTimer);
  });

  return (
    <div class="flex flex-col gap-5 h-full overflow-y-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {clash.version()
              ? `Clash Meta v${clash.version().version}`
              : "Not Connected"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          label={t().dashboard.download}
          value={formatSpeed(downSpeed())}
          subValue={`Total: ${formatBytes(totalDown())}`}
          color="var(--accent)"
        />
        <StatCard
          icon="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          label={t().dashboard.upload}
          value={formatSpeed(upSpeed())}
          subValue={`Total: ${formatBytes(totalUp())}`}
          color="var(--accent2)"
        />
        <StatCard
          icon="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM12 5.5v9l6-4.5z"
          label={t().dashboard.activeConnections}
          value={String(connCount())}
          color="var(--success)"
        />
        <StatCard
          icon="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"
          label={t().dashboard.memoryUsage}
          value={formatBytes(memory())}
          color="var(--warning)"
        />
      </div>

      {/* Traffic Chart + Mode */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2">
          <TrafficChart />
        </div>
        <div class="flex flex-col gap-4">
          <ModeSwitcher />
        </div>
      </div>
    </div>
  );
}
