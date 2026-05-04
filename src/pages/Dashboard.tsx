import { createSignal, createEffect, onMount, onCleanup, For } from "solid-js";
import { createStore } from "solid-js/store";
import { ArrowUp, ArrowDown, Activity, Cpu, Zap, Shield, Globe, GripVertical } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs, type WsState } from "@/services/clash-ws";
import { formatBytes, formatSpeed } from "@/utils/format";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ripple from "@/components/ui/RippleEffect";

const LAYOUT_KEY = "hyperion-dashboard-layout";

// 默认卡片顺序
const DEFAULT_CARDS = ["upload", "download", "connections", "memory", "chart"] as const;
type CardId = typeof DEFAULT_CARDS[number];

function loadLayout(): CardId[] {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_CARDS.length) {
        return parsed;
      }
    }
  } catch {}
  return [...DEFAULT_CARDS];
}

function saveLayout(cards: CardId[]) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(cards));
  } catch {}
}

export default function Dashboard() {
  const clash = useClashStore();
  const wsManager = useClashWs();
  const [upSpeed, setUpSpeed] = createSignal(0);
  const [downSpeed, setDownSpeed] = createSignal(0);
  const [totalUp, setTotalUp] = createSignal(0);
  const [totalDown, setTotalDown] = createSignal(0);
  const [connCount, setConnCount] = createSignal(0);
  const [memory, setMemory] = createSignal(0);
  const [mode, setMode] = createSignal("rule");
  const [trafficHistory, setTrafficHistory] = createSignal<{ up: number; down: number }[]>([]);
  const [memoryHistory, setMemoryHistory] = createSignal<number[]>([]);
  const [wsState, setWsState] = createSignal<WsState>("disconnected");

  // 拖拽状态
  const [cards, setCards] = createStore<{ order: CardId[] }>({ order: loadLayout() });
  const [dragIndex, setDragIndex] = createSignal<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);

  let canvasRef: HTMLCanvasElement | undefined;
  let memoryCanvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;

  onMount(async () => {
    if (clash.config()) setMode(clash.config()?.mode || "rule");
    connectTrafficWs();
    connectMemoryWs();

    // 监听 WS 状态变化
    const unsub = wsManager.onStateChange(() => {
      setWsState(wsManager.trafficState);
    });

    onCleanup(() => {
      unsub();
      wsManager.disconnectTraffic();
    });
  });

  const connectMemoryWs = () => {
    // 通过 traffic WS 获取内存数据（Hades 在 traffic 消息中不带内存，需要单独轮询）
    // 但降低频率到 15 秒
    const fetchMemory = async () => {
      try {
        const res = await fetch(`${clash.baseUrl()}/memory`, { headers: clash.headers() });
        if (res.ok) {
          const d = await res.json();
          const mem = d.inuse || 0;
          setMemory(mem);
          setMemoryHistory((prev) => {
            const next = [...prev, mem];
            return next.length > 180 ? next.slice(-180) : next;
          });
        }
      } catch (e) { console.error(e) }
    };

    fetchMemory();
    const memInterval = setInterval(fetchMemory, 15000);
    onCleanup(() => clearInterval(memInterval));
  };

  const connectTrafficWs = () => {
    wsManager.connectTraffic((data) => {
      setUpSpeed(data.up || 0);
      setDownSpeed(data.down || 0);
      setTotalUp((prev) => prev + (data.up || 0));
      setTotalDown((prev) => prev + (data.down || 0));
      setTrafficHistory((prev) => {
        const next = [...prev, { up: data.up || 0, down: data.down || 0 }];
        return next.length > 180 ? next.slice(-180) : next;
      });
    });
  };

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

      const rootStyles = getComputedStyle(document.documentElement);
      const gridOpacity = Number.parseFloat(rootStyles.getPropertyValue("--landscape-grid-opacity")) || 0.16;
      const baseGrid = rootStyles.getPropertyValue("--color-base-300").trim() || "#e8e8ed";
      ctx.strokeStyle = `color-mix(in oklab, ${baseGrid} ${Math.round(gridOpacity * 100)}%, transparent)`;
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
          ctx.lineTo(x, y);
        }
        ctx.lineTo(cw, ch);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, ch);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fill();

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
    } catch (e) { console.error(e) }
  };

  // 拖拽处理
  const handleDragStart = (e: DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer!.effectAllowed = "move";
    e.dataTransfer!.setData("text/plain", String(index));
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex();
    if (from !== null && from !== index) {
      const newOrder = [...cards.order];
      const [moved] = newOrder.splice(from, 1);
      newOrder.splice(index, 0, moved);
      setCards("order", newOrder);
      saveLayout(newOrder);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // 卡片渲染映射
  const cardRenderers: Record<CardId, () => JSX.Element> = {
    upload: () => (
      <div class="stat-card card bg-base-100 p-4 animate-card-spring">
        <div class="flex items-center gap-2 text-base-content/50 mb-2">
          <ArrowUp size={16} class="text-success" />
          <span class="text-xs font-medium">上传速率</span>
        </div>
        <div class="text-2xl font-bold tracking-tight">
          <AnimatedCounter value={upSpeed()} format={formatSpeed} />
        </div>
        <div class="text-xs text-base-content/40 mt-1">总计 {formatBytes(totalUp())}</div>
      </div>
    ),
    download: () => (
      <div class="stat-card card bg-base-100 p-4 animate-card-spring">
        <div class="flex items-center gap-2 text-base-content/50 mb-2">
          <ArrowDown size={16} class="text-primary" />
          <span class="text-xs font-medium">下载速率</span>
        </div>
        <div class="text-2xl font-bold tracking-tight">
          <AnimatedCounter value={downSpeed()} format={formatSpeed} />
        </div>
        <div class="text-xs text-base-content/40 mt-1">总计 {formatBytes(totalDown())}</div>
      </div>
    ),
    connections: () => (
      <div class="stat-card card bg-base-100 p-4 animate-card-spring">
        <div class="flex items-center gap-2 text-base-content/50 mb-2">
          <Activity size={16} class="text-orange-500" />
          <span class="text-xs font-medium">活跃连接</span>
        </div>
        <div class="text-2xl font-bold tracking-tight">
          <AnimatedCounter value={connCount()} />
        </div>
        <div class="text-xs text-base-content/40 mt-1">实时连接数</div>
      </div>
    ),
    memory: () => (
      <div class="stat-card card bg-base-100 p-4 animate-card-spring">
        <div class="flex items-center gap-2 text-base-content/50 mb-2">
          <Cpu size={16} class="text-purple-500" />
          <span class="text-xs font-medium">内存使用</span>
        </div>
        <div class="text-2xl font-bold tracking-tight">
          <AnimatedCounter value={memory()} format={formatBytes} />
        </div>
        <div class="mt-2 h-8">
          <svg class="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgb(168,85,247)" stop-opacity="0.3" />
                <stop offset="100%" stop-color="rgb(168,85,247)" stop-opacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const hist = memoryHistory();
              if (hist.length < 2) return null;
              const max = Math.max(1, ...hist);
              const points = 30;
              const slice = hist.slice(-points);
              const line = slice.map((v, i) => `${(i / (points - 1)) * 100},${20 - (v / max) * 18}`).join(" ");
              const area = `0,20 ${line} 100,20`;
              return <>
                <polygon points={area} fill="url(#memGrad)" />
                <polyline points={line} fill="none" stroke="rgb(168,85,247)" stroke-width="1.5" />
              </>;
            })()}
          </svg>
        </div>
        <div class="text-xs text-base-content/40 mt-1">Hades</div>
      </div>
    ),
    chart: () => (
      <div class="card bg-base-100 animate-card-spring col-span-2 lg:col-span-4">
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
    ),
  };

  return (
    <div class="animate-page-in-enhanced space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-adaptive">仪表盘</h1>
          <p class="text-sm text-base-content/50 mt-0.5">实时监控代理流量与系统状态 · 拖拽卡片可调整布局</p>
        </div>
        <div class="flex items-center gap-2">
          <span
            class={`badge badge-sm gap-1 ${
              wsState() === "connected" ? "badge-success" :
              wsState() === "connecting" ? "badge-warning" :
              "badge-error"
            }`}
          >
            <span class={`w-1.5 h-1.5 rounded-full ${wsState() === "connected" ? "animate-subtle-pulse" : ""}`} />
            {wsState() === "connected" ? "WS 已连接" :
             wsState() === "connecting" ? "WS 连接中..." :
             wsState() === "error" ? "WS 错误" : "WS 断开"}
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div class="flex gap-2">
        {(["rule", "global", "direct"] as const).map((m) => (
          <button
            use:ripple
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

      {/* Draggable Cards Grid */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <For each={cards.order}>
          {(cardId, index) => (
            <div
              class={`relative group transition-all duration-200 ${
                dragOverIndex() === index() && dragIndex() !== index() ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100 rounded-xl" : ""
              } ${dragIndex() === index() ? "opacity-50 scale-95" : ""}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index())}
              onDragOver={(e) => handleDragOver(e, index())}
              onDrop={(e) => handleDrop(e, index())}
              onDragEnd={handleDragEnd}
            >
              {/* Drag Handle (visible on hover) */}
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing">
                <GripVertical size={14} class="text-base-content/30" />
              </div>
              {cardRenderers[cardId]()}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
