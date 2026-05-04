import { createSignal, createEffect, onMount, onCleanup, For, Show, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import {
  ArrowUp, ArrowDown, Activity, Cpu, Zap, Shield, Globe,
  Clock, Cloud, Server, Wifi, HardDrive, Heart, TrendingUp,
  Eye, ChevronRight, BarChart3, PieChart, Layers, Monitor,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs, type WsState } from "@/services/clash-ws";
import { formatBytes, formatSpeed } from "@/utils/format";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ripple from "@/components/ui/RippleEffect";

// Mock node data (would come from API in production)
interface NodeInfo {
  name: string;
  protocol: string;
  delay: number | string;
  load: number;
  status: "online" | "offline" | "warning";
  flag: string;
  traffic: number;
}

// Mock connections
interface ConnectionInfo {
  time: string;
  clientIp: string;
  node: string;
  protocol: string;
  upload: number;
  download: number;
  status: "connected" | "closed";
}

// Mock protocol stats
interface ProtocolStat {
  name: string;
  percentage: number;
  traffic: number;
  color: string;
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
  const [wsState, setWsState] = createSignal<WsState>("disconnected");

  // Time & greeting
  const [currentTime, setCurrentTime] = createSignal("");
  const [currentDate, setCurrentDate] = createSignal("");
  const [greeting, setGreeting] = createSignal("");

  // System stats
  const [cpuUsage, setCpuUsage] = createSignal(45);
  const [memUsage, setMemUsage] = createSignal(37);
  const [diskUsage, setDiskUsage] = createSignal(32);
  const [healthScore, setHealthScore] = createSignal(87);
  const [uptime, setUptime] = createSignal("3d 14h 23m");

  // Active region
  const [activeRegion, setActiveRegion] = createSignal("日本·东京");

  // Traffic chart time range
  const [chartRange, setChartRange] = createSignal("hourly");

  let canvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;

  // Update time
  const updateTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const h = String(hours).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    setCurrentTime(`${h}:${m}`);

    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    setCurrentDate(`${month}月${day}日 星期${weekdays[now.getDay()]}`);

    if (hours < 6) setGreeting("夜深了，管理员🌙");
    else if (hours < 12) setGreeting("早安，管理员👋");
    else if (hours < 18) setGreeting("下午好，管理员☀️");
    else setGreeting("晚上好，管理员🌆");
  };

  // Mock node data
  const nodes = createMemo<NodeInfo[]>(() => [
    { name: "日本节点02", protocol: "VLESS", delay: 28, load: 22, status: "online", flag: "🇯🇵", traffic: 98.21e9 },
    { name: "新加坡节点03", protocol: "Trojan", delay: 45, load: 35, status: "online", flag: "🇸🇬", traffic: 76.54e9 },
    { name: "美国节点04", protocol: "VMess", delay: 156, load: 48, status: "online", flag: "🇺🇸", traffic: 54.32e9 },
    { name: "香港节点01", protocol: "VLESS", delay: 32, load: 15, status: "online", flag: "🇭🇰", traffic: 45.67e9 },
    { name: "德国节点05", protocol: "Shadowsocks", delay: 189, load: 67, status: "warning", flag: "🇩🇪", traffic: 4.07e9 },
    { name: "英国节点06", protocol: "VMess", delay: "-", load: 0, status: "offline", flag: "🇬🇧", traffic: 0 },
  ]);

  // Protocol stats
  const protocols = createMemo<ProtocolStat[]>(() => [
    { name: "VMess", percentage: 42.3, traffic: 118.01e9, color: "#FF3B30" },
    { name: "VLESS", percentage: 28.7, traffic: 80.01e9, color: "#007AFF" },
    { name: "Trojan", percentage: 17.1, traffic: 47.61e9, color: "#AF52DE" },
    { name: "Shadowsocks", percentage: 8.9, traffic: 24.78e9, color: "#5AC8FA" },
    { name: "其他", percentage: 3.0, traffic: 8.40e9, color: "#8E8E93" },
  ]);

  // Mock connections
  const connections = createMemo<ConnectionInfo[]>(() => [
    { time: "15:30:22", clientIp: "192.168.1.100", node: "日本节点02", protocol: "VLESS", upload: 2.45e6, download: 12.45e6, status: "connected" },
    { time: "15:28:15", clientIp: "192.168.1.101", node: "新加坡节点03", protocol: "Trojan", upload: 1.23e6, download: 8.67e6, status: "connected" },
    { time: "15:25:03", clientIp: "192.168.1.102", node: "美国节点04", protocol: "VMess", upload: 5.67e6, download: 23.45e6, status: "connected" },
    { time: "15:23:11", clientIp: "192.168.1.104", node: "香港节点01", protocol: "VLESS", upload: 0.89e6, download: 4.56e6, status: "connected" },
    { time: "15:20:45", clientIp: "192.168.1.100", node: "日本节点02", protocol: "VLESS", upload: 3.21e6, download: 15.78e6, status: "connected" },
  ]);

  // Top 5 nodes by traffic
  const topNodes = createMemo(() => {
    return [...nodes()]
      .filter((n) => n.traffic > 0)
      .sort((a, b) => b.traffic - a.traffic)
      .slice(0, 5);
  });

  // Hourly traffic data for bar chart
  const hourlyTraffic = createMemo(() => {
    const data: { hour: string; up: number; down: number }[] = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        hour: `${String(i).padStart(2, "0")}:00`,
        up: Math.random() * 80 + 10,
        down: Math.random() * 200 + 50,
      });
    }
    return data;
  });

  onMount(async () => {
    if (clash.config()) setMode(clash.config()?.mode || "rule");
    updateTime();
    const timeTimer = setInterval(updateTime, 10000);
    connectTrafficWs();

    const unsub = wsManager.onStateChange(() => {
      setWsState(wsManager.trafficState);
    });

    // Simulate system stats updates
    const statsTimer = setInterval(() => {
      setCpuUsage((prev) => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 10)));
      setMemUsage((prev) => Math.max(25, Math.min(65, prev + (Math.random() - 0.5) * 5)));
      setHealthScore((prev) => Math.max(70, Math.min(98, prev + (Math.random() - 0.5) * 3)));
    }, 5000);

    onCleanup(() => {
      unsub();
      clearInterval(timeTimer);
      clearInterval(statsTimer);
      wsManager.disconnectTraffic();
    });
  });

  const connectTrafficWs = () => {
    wsManager.connectTraffic((data) => {
      setUpSpeed(data.up || 0);
      setDownSpeed(data.down || 0);
      setTotalUp((prev) => prev + (data.up || 0));
      setTotalDown((prev) => prev + (data.down || 0));
      setConnCount(data.connections || 0);
      setTrafficHistory((prev) => {
        const next = [...prev, { up: data.up || 0, down: data.down || 0 }];
        return next.length > 180 ? next.slice(-180) : next;
      });
    });
  };

  // Canvas traffic chart
  createEffect(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvasRef || !ctx) return;
      const w = (canvasRef.width = canvasRef.clientWidth * 2);
      const h = (canvasRef.height = canvasRef.clientHeight * 2);
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
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-base-300").trim() || "#e8e8ed";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      const drawArea = (key: "up" | "down", color: string, fillColor: string) => {
        ctx!.beginPath();
        ctx!.moveTo(0, ch);
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = (cw / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          ctx!.lineTo(x, y);
        }
        ctx!.lineTo(cw, ch);
        ctx!.closePath();
        const gradient = ctx!.createLinearGradient(0, 0, 0, ch);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, "transparent");
        ctx!.fillStyle = gradient;
        ctx!.fill();

        ctx!.beginPath();
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = (cw / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = color;
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
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
      await fetch(`${clash.baseUrl()}/configs`, {
        method: "PATCH",
        headers: clash.headers(),
        body: JSON.stringify({ mode: m }),
      });
      setMode(m);
    } catch (e) {
      console.error(e);
    }
  };

  // Protocol pie chart SVG
  const ProtocolPieChart = () => {
    const data = protocols();
    const total = data.reduce((s, p) => s + p.traffic, 0);
    let acc = 0;
    const radius = 60;
    const cx = 75;
    const cy = 75;

    const arcs = data.map((p) => {
      const startAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
      acc += p.traffic;
      const endAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...p, path };
    });

    return (
      <div class="flex items-center gap-6">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <For each={arcs}>
            {(arc) => <path d={arc.path} fill={arc.color} stroke="var(--color-base-100)" stroke-width="2" />}
          </For>
          <circle cx={cx} cy={cy} r="35" fill="var(--color-base-100)" />
          <text x={cx} y={cy - 6} text-anchor="middle" class="text-xs font-bold" fill="var(--color-base-content)">
            {formatBytes(total)}
          </text>
          <text x={cx} y={cy + 10} text-anchor="middle" class="text-[10px]" fill="var(--color-base-content)" opacity="0.5">
            总流量
          </text>
        </svg>
        <div class="flex flex-col gap-2 flex-1">
          <For each={data}>
            {(p) => (
              <div class="flex items-center gap-2 text-xs">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ "background-color": p.color }} />
                <span class="text-base-content/70 flex-1">{p.name}</span>
                <span class="font-medium">{p.percentage}%</span>
                <span class="text-base-content/40 w-20 text-right">{formatBytes(p.traffic)}</span>
              </div>
            )}
          </For>
        </div>
      </div>
    );
  };

  // Traffic bar chart
  const TrafficBarChart = () => {
    const data = hourlyTraffic();
    const maxVal = Math.max(1, ...data.map((d) => Math.max(d.up, d.down)));
    const barHeight = 140;

    return (
      <div class="flex items-end gap-1 h-[180px] px-2">
        <For each={data}>
          {(d) => {
            const downH = (d.down / maxVal) * barHeight;
            const upH = (d.up / maxVal) * barHeight;
            return (
              <div class="flex-1 flex flex-col items-center gap-0.5 group">
                <div class="flex gap-0.5 items-end" style={{ height: `${barHeight}px` }}>
                  <div
                    class="w-2 md:w-3 rounded-t-sm bg-primary/80 transition-all duration-200 group-hover:bg-primary"
                    style={{ height: `${downH}px` }}
                  />
                  <div
                    class="w-2 md:w-3 rounded-t-sm bg-success/80 transition-all duration-200 group-hover:bg-success"
                    style={{ height: `${upH}px` }}
                  />
                </div>
                <span class="text-[9px] text-base-content/30 hidden md:block">{d.hour.slice(0, 2)}</span>
              </div>
            );
          }}
        </For>
      </div>
    );
  };

  // System status ring
  const SystemStatusRing = () => {
    const score = healthScore();
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div class="flex flex-col items-center">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="45" fill="none" stroke="var(--color-base-300)" stroke-width="8" />
          <circle
            cx="60" cy="60" r="45" fill="none"
            stroke="var(--color-primary)"
            stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray={circumference}
            stroke-dashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
          <text x="60" y="55" text-anchor="middle" class="text-2xl font-bold" fill="var(--color-base-content)">
            {Math.round(score)}%
          </text>
          <text x="60" y="72" text-anchor="middle" class="text-[10px]" fill="var(--color-base-content)" opacity="0.5">
            健康度
          </text>
        </svg>
      </div>
    );
  };

  // Progress bar component
  const ProgressBar = (props: { label: string; value: number; color: string; icon: any }) => {
    return (
      <div class="flex items-center gap-3">
        <props.icon size={14} style={{ color: props.color }} class="flex-shrink-0" />
        <div class="flex-1">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-base-content/60">{props.label}</span>
            <span class="font-medium">{Math.round(props.value)}%</span>
          </div>
          <div class="h-1.5 rounded-full bg-base-300 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              style={{ width: `${props.value}%`, "background-color": props.color }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Delay color helper
  const delayColor = (delay: number | string) => {
    if (typeof delay === "string") return "text-base-content/30";
    if (delay < 50) return "text-success";
    if (delay < 100) return "text-info";
    if (delay < 200) return "text-warning";
    return "text-error";
  };

  const statusDot = (status: string) => {
    if (status === "online") return "bg-success";
    if (status === "warning") return "bg-warning";
    return "bg-error";
  };

  return (
    <div class="animate-page-in-enhanced space-y-6">
      {/* Welcome Header */}
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{greeting()}</h1>
          <p class="text-sm text-base-content/50 mt-0.5">一切运行正常，祝你有美好的一天！</p>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-1.5 text-base-content/60">
            <Globe size={14} />
            <span>{activeRegion()}</span>
          </div>
          <div class="flex items-center gap-1.5 text-base-content/60">
            <Clock size={14} />
            <span>{currentTime()} {currentDate()}</span>
          </div>
          <div class="flex items-center gap-1.5 text-base-content/60">
            <Cloud size={14} />
            <span>23℃ 晴朗</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Upload */}
        <div class="stat-card card bg-base-100 p-4 animate-card-spring">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <ArrowUp size={16} class="text-success" />
            <span class="text-xs font-medium">总上传</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">
            <AnimatedCounter value={totalUp()} format={formatBytes} />
          </div>
          <div class="flex items-center gap-1 text-xs text-success mt-1">
            <TrendingUp size={12} />
            <span>+12.5% 较昨日</span>
          </div>
          <div class="mt-2 h-6">
            <svg class="w-full h-full" viewBox="0 0 100 16" preserveAspectRatio="none">
              {(() => {
                const hist = trafficHistory();
                if (hist.length < 2) return null;
                const max = Math.max(1, ...hist.map((h) => h.up));
                const slice = hist.slice(-30);
                const line = slice.map((v, i) => `${(i / 29) * 100},${16 - (v.up / max) * 14}`).join(" ");
                return <polyline points={line} fill="none" stroke="rgb(52,199,89)" stroke-width="1.5" />;
              })()}
            </svg>
          </div>
        </div>

        {/* Total Download */}
        <div class="stat-card card bg-base-100 p-4 animate-card-spring stagger-1">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <ArrowDown size={16} class="text-primary" />
            <span class="text-xs font-medium">总下载</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">
            <AnimatedCounter value={totalDown()} format={formatBytes} />
          </div>
          <div class="flex items-center gap-1 text-xs text-primary mt-1">
            <TrendingUp size={12} />
            <span>+8.3% 较昨日</span>
          </div>
          <div class="mt-2 h-6">
            <svg class="w-full h-full" viewBox="0 0 100 16" preserveAspectRatio="none">
              {(() => {
                const hist = trafficHistory();
                if (hist.length < 2) return null;
                const max = Math.max(1, ...hist.map((h) => h.down));
                const slice = hist.slice(-30);
                const line = slice.map((v, i) => `${(i / 29) * 100},${16 - (v.down / max) * 14}`).join(" ");
                return <polyline points={line} fill="none" stroke="rgb(0,122,255)" stroke-width="1.5" />;
              })()}
            </svg>
          </div>
        </div>

        {/* Active Connections */}
        <div class="stat-card card bg-base-100 p-4 animate-card-spring stagger-2">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <Activity size={16} class="text-orange-500" />
            <span class="text-xs font-medium">活跃连接</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">
            <AnimatedCounter value={connCount()} />
          </div>
          <div class="flex items-center gap-1 text-xs text-orange-500 mt-1">
            <TrendingUp size={12} />
            <span>+15.2% 较昨日</span>
          </div>
          <div class="mt-2 h-6">
            <svg class="w-full h-full" viewBox="0 0 100 16" preserveAspectRatio="none">
              {(() => {
                const hist = trafficHistory();
                if (hist.length < 2) return null;
                const max = Math.max(1, ...hist.map((h) => h.up + h.down));
                const slice = hist.slice(-30);
                const line = slice.map((v, i) => `${(i / 29) * 100},${16 - ((v.up + v.down) / max) * 14}`).join(" ");
                return <polyline points={line} fill="none" stroke="rgb(255,149,0)" stroke-width="1.5" />;
              })()}
            </svg>
          </div>
        </div>

        {/* Uptime */}
        <div class="stat-card card bg-base-100 p-4 animate-card-spring stagger-3">
          <div class="flex items-center gap-2 text-base-content/50 mb-2">
            <Heart size={16} class="text-purple-500" />
            <span class="text-xs font-medium">运行时间</span>
          </div>
          <div class="text-2xl font-bold tracking-tight">{uptime()}</div>
          <div class="text-xs text-base-content/40 mt-1">系统运行稳定</div>
          <div class="mt-2 h-6">
            <svg class="w-full h-full" viewBox="0 0 100 16" preserveAspectRatio="none">
              <polyline points="0,12 15,8 30,10 45,6 60,9 75,5 90,7 100,4" fill="none" stroke="rgb(168,85,247)" stroke-width="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      <div class="card bg-base-100 animate-card-spring">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <span class="font-medium text-sm">流量趋势</span>
          <div class="flex items-center gap-3">
            <select
              class="select select-xs select-bordered"
              value={chartRange()}
              onChange={(e) => setChartRange(e.currentTarget.value)}
            >
              <option value="hourly">按小时</option>
              <option value="daily">按天</option>
              <option value="weekly">按周</option>
            </select>
            <div class="flex items-center gap-3 text-xs text-base-content/50">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary" /> 下载</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-success" /> 上传</span>
            </div>
          </div>
        </div>
        <div class="p-4" style={{ height: "220px" }}>
          <canvas ref={canvasRef} class="w-full h-full" />
        </div>
      </div>

      {/* Two Column: Node Status + Protocol Chart */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Node Status */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <span class="font-medium text-sm">节点状态</span>
            <button class="btn btn-ghost btn-xs gap-1">
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div class="p-2">
            <For each={nodes()}>
              {(node) => (
                <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200/50 transition-colors">
                  <span class={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(node.status)}`} />
                  <span class="text-sm flex-1 truncate">{node.flag} {node.name}</span>
                  <span class="badge badge-xs badge-outline">{node.protocol}</span>
                  <span class={`text-sm font-mono w-14 text-right ${delayColor(node.delay)}`}>
                    {typeof node.delay === "number" ? `${node.delay}ms` : node.delay}
                  </span>
                  <div class="w-16">
                    <div class="h-1 rounded-full bg-base-300 overflow-hidden">
                      <div
                        class="h-full rounded-full bg-primary/60"
                        style={{ width: `${node.load}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </For>
            <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-base-200/30 mt-1">
              <span class="w-2 h-2 rounded-full bg-base-content/20 flex-shrink-0" />
              <span class="text-sm flex-1 text-base-content/50">全部节点</span>
              <span class="text-sm text-base-content/40">{nodes().length} 个</span>
            </div>
          </div>
        </div>

        {/* Protocol Usage */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <span class="font-medium text-sm">协议使用情况</span>
          </div>
          <div class="p-4">
            <ProtocolPieChart />
          </div>
        </div>
      </div>

      {/* Two Column: Traffic Stats + Top Nodes */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic Bar Chart */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <span class="font-medium text-sm">流量统计</span>
            <div class="flex items-center gap-3 text-xs text-base-content/50">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary" /> 下载</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-success" /> 上传</span>
            </div>
          </div>
          <div class="p-4">
            <TrafficBarChart />
          </div>
        </div>

        {/* Top 5 Nodes */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <span class="font-medium text-sm">各节点流量 TOP5</span>
          </div>
          <div class="p-2">
            <For each={topNodes()}>
              {(node, i) => {
                const colors = ["#FF3B30", "#007AFF", "#34C759", "#5AC8FA", "#AF52DE"];
                return (
                  <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-base-200/50 transition-colors">
                    <span
                      class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ "background-color": colors[i()] }}
                    >
                      {i() + 1}
                    </span>
                    <span class="text-sm flex-1">{node.flag} {node.name}</span>
                    <span class="text-sm font-mono text-base-content/70">{formatBytes(node.traffic)}</span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      {/* Latest Connections */}
      <div class="card bg-base-100 animate-card-spring">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <span class="font-medium text-sm">最新连接</span>
          <button class="btn btn-ghost btn-xs gap-1">
            查看全部 <ChevronRight size={12} />
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="text-xs text-base-content/50">
                <th>时间</th>
                <th>客户端 IP</th>
                <th>节点</th>
                <th>协议</th>
                <th>上传</th>
                <th>下载</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <For each={connections()}>
                {(conn) => (
                  <tr class="hover:bg-base-200/30 transition-colors">
                    <td class="font-mono text-xs">{conn.time}</td>
                    <td class="font-mono text-xs">{conn.clientIp}</td>
                    <td class="text-sm">{conn.node}</td>
                    <td><span class="badge badge-xs badge-outline">{conn.protocol}</span></td>
                    <td class="font-mono text-xs">{formatBytes(conn.upload)}</td>
                    <td class="font-mono text-xs">{formatBytes(conn.download)}</td>
                    <td>
                      <span class="badge badge-xs badge-success gap-1">
                        <span class="w-1 h-1 rounded-full bg-white animate-subtle-pulse" />
                        连接
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-center gap-1 p-3 border-t border-base-300">
          <For each={[1, 2, 3]}>
            {(p) => (
              <button class={`btn btn-xs ${p === 1 ? "btn-primary" : "btn-ghost"}`}>{p}</button>
            )}
          </For>
          <span class="text-xs text-base-content/30 mx-1">...</span>
          <button class="btn btn-ghost btn-xs">20</button>
        </div>
      </div>

      {/* System Status */}
      <div class="card bg-base-100 animate-card-spring">
        <div class="flex items-center justify-between p-4 border-b border-base-300">
          <span class="font-medium text-sm">系统状态</span>
          <span class="text-xs text-base-content/40">运行时间: {uptime()}</span>
        </div>
        <div class="p-4 flex flex-col md:flex-row items-center gap-8">
          <SystemStatusRing />
          <div class="flex-1 space-y-4 w-full">
            <ProgressBar label="CPU 使用率" value={cpuUsage()} color="#007AFF" icon={Cpu} />
            <ProgressBar label="内存使用率" value={memUsage()} color="#34C759" icon={Monitor} />
            <ProgressBar label="磁盘使用率" value={diskUsage()} color="#5AC8FA" icon={HardDrive} />
          </div>
        </div>
      </div>

      {/* Mode Switcher (compact) */}
      <div class="flex items-center justify-center gap-2 pt-2">
        {(["rule", "global", "direct"] as const).map((m) => (
          <button
            use:ripple
            onClick={() => switchMode(m)}
            class={`btn btn-sm rounded-xl ${mode() === m ? "btn-primary" : "btn-ghost"}`}
          >
            {m === "rule" && <Shield size={14} />}
            {m === "global" && <Globe size={14} />}
            {m === "direct" && <Zap size={14} />}
            {m === "rule" ? "规则模式" : m === "global" ? "全局模式" : "直连模式"}
          </button>
        ))}
      </div>
    </div>
  );
}
