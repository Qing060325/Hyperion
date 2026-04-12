import { createSignal, createEffect, onMount, onCleanup, For } from "solid-js";
import { ArrowUp, ArrowDown, Activity, Cpu, Zap, Shield, Globe } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { formatBytes, formatSpeed } from "@/utils/format";

export default function Dashboard() {
  const clash = useClashStore();
  const [upSpeed, setUpSpeed] = createSignal(0);
  const [downSpeed, setDownSpeed] = createSignal(0);
  const [totalUp, setTotalUp] = createSignal(0);
  const [totalDown, setTotalDown] = createSignal(0);
  const [connections, setConnections] = createSignal(0);
  const [memory, setMemory] = createSignal(0);
  const [mode, setMode] = createSignal("rule");
  const [trafficHistory, setTrafficHistory] = createSignal<{ up: number; down: number }[]>([]);
  let canvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;

  onMount(async () => {
    await clash.connect();
    if (clash.config()) setMode(clash.config()?.mode || "rule");
  });

  // Poll memory/connections
  createEffect(() => {
    if (!clash.connected()) return;
    const interval = setInterval(async () => {
      try {
        const base = clash.baseUrl();
        const h = clash.headers();
        const memRes = await fetch(`${base}/memory`, { headers: h });
        if (memRes.ok) {
          const d = await memRes.json();
          setMemory(d.inuse || 0);
        }
      } catch {}
    }, 3000);
    onCleanup(() => clearInterval(interval));
  });

  // Canvas chart
  createEffect(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvasRef || !ctx) return;
      const w = canvasRef.width = canvasRef.clientWidth * 2;
      const h = canvasRef.height = canvasRef.clientHeight * 2;
      ctx.scale(2, 2);
      const cw = canvasRef.clientWidth;
      const ch = canvasRef.clientHeight;

      ctx.clearRect(0, 0, cw, ch);

      const history = trafficHistory();
      if (history.length < 2) {
        animFrame = requestAnimationFrame(draw);
        return;
      }

      const maxVal = Math.max(1, ...history.map((h) => Math.max(h.up, h.down)));
      const points = 120;

      // Grid lines
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-base-300")
        .trim() || "#e8e8ed";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      const drawArea = (key: "up" | "down", color: string, fillColor: string) => {
        ctx.beginPath();
        ctx.moveTo(0, ch);
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = (cw / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          if (i === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(cw, ch);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, ch);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = (cw / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      drawArea("down", isDark ? "#0A84FF" : "#007AFF", isDark ? "rgba(10,132,255,0.15)" : "rgba(0,122,255,0.1)");
      drawArea("up", isDark ? "#30D158" : "#34C759", isDark ? "rgba(48,209,88,0.15)" : "rgba(52,199,89,0.1)");

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    onCleanup(() => cancelAnimationFrame(animFrame));
  });

  const switchMode = async (m: string) => {
    try {
      const h = clash.headers();
      await fetch(`${clash.baseUrl()}/configs`, {
        method: "PATCH",
        headers: h,
        body: JSON.stringify({ mode: m }),
      });
      setMode(m);
    } catch {}
  };

  return (
    <div class="animate-page-in space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">仪表盘</h1>
          <p class="text-sm text-base-content/50 mt-0.5">实时监控代理流量与系统状态</p>
        </div>
        <div class="flex items-center gap-2">
          <span
            class={`badge badge-sm gap-1 ${
              clash.connected() ? "badge-success" : "badge-error"
            }`}
          >
            <span class={`w-1.5 h-1.5 rounded-full ${clash.connected() ? "animate-subtle-pulse" : ""}`} />
            {clash.connected() ? "已连接" : "未连接"}
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div class="flex gap-2">
        {(["rule", "global", "direct"] as const).map((m) => (
          <button
            onClick={() => switchMode(m)}
            class={`btn btn-sm rounded-xl ${
              mode() === m ? "btn-primary" : "btn-ghost"
            }`}
          >
            {m === "rule" && <Shield size={14} />}
            {m === "global" && <Globe size={14} />}
            {m === "direct" && <Zap size={14} />}
            {m === "rule" ? "规则" : m === "global" ? "全局" : "直连"}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card card bg-base-100 p-4 animate-card-in stagger-1">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <ArrowUp size={16} class="text-success" />
            <span class="text-xs font-medium">上传速率</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">{formatSpeed(upSpeed())}</div>
          <div class="text-xs text-base-content/40 mt-1">总计 {formatBytes(totalUp())}</div>
        </div>
        <div class="stat-card card bg-base-100 p-4 animate-card-in stagger-2">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <ArrowDown size={16} class="text-primary" />
            <span class="text-xs font-medium">下载速率</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">{formatSpeed(downSpeed())}</div>
          <div class="text-xs text-base-content/40 mt-1">总计 {formatBytes(totalDown())}</div>
        </div>
        <div class="stat-card card bg-base-100 p-4 animate-card-in stagger-3">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <Activity size={16} class="text-orange-500" />
            <span class="text-xs font-medium">活跃连接</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">{connections()}</div>
          <div class="text-xs text-base-content/40 mt-1">实时连接数</div>
        </div>
        <div class="stat-card card bg-base-100 p-4 animate-card-in stagger-4">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <Cpu size={16} class="text-purple-500" />
            <span class="text-xs font-medium">内存使用</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">{formatBytes(memory())}</div>
          <div class="text-xs text-base-content/40 mt-1">Clash Meta</div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div class="card bg-base-100 animate-card-in stagger-5">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <span class="font-medium text-sm">流量趋势</span>
          <div class="flex items-center gap-3 text-xs text-base-content/50">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-primary" /> 下载
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-success" /> 上传
            </span>
          </div>
        </div>
        <div class="p-4" style={{ height: "200px" }}>
          <canvas ref={canvasRef} class="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
