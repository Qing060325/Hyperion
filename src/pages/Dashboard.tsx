import { createSignal, createEffect, onMount, onCleanup, For, Show, createMemo } from "solid-js";
import {
  ArrowUp, ArrowDown, Activity, Cpu, Heart, TrendingUp,
  Globe, Clock, Cloud, ChevronRight, HardDrive, Monitor,
  Server, CheckCircle,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs, type WsState } from "@/services/clash-ws";
import { formatBytes, formatSpeed } from "@/utils/format";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import Header from "@/components/layout/Header";
import { activeNode } from "@/stores/activeNode";
import { detectRegion, SCENES } from "@/components/scenic/ScenicBackdrop";

// Types
interface NodeInfo {
  name: string;
  protocol: string;
  delay: number | string;
  load: number;
  status: "online" | "offline" | "warning";
  flag: string;
  traffic: number;
  region: string;
}

interface ConnectionInfo {
  time: string;
  clientIp: string;
  node: string;
  protocol: string;
  upload: number;
  download: number;
  status: "connected" | "closed";
}

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
  const [totalUp, setTotalUp] = createSignal(32.14e9);
  const [totalDown, setTotalDown] = createSignal(246.67e9);
  const [connCount, setConnCount] = createSignal(146);
  const [mode, setMode] = createSignal("rule");
  const [trafficHistory, setTrafficHistory] = createSignal<{ up: number; down: number }[]>([]);
  const [wsState, setWsState] = createSignal<WsState>("disconnected");

  // Time
  const [currentTime, setCurrentTime] = createSignal("");
  const [currentDate, setCurrentDate] = createSignal("");
  const [greeting, setGreeting] = createSignal("");

  // System
  const [cpuUsage, setCpuUsage] = createSignal(45);
  const [memUsage, setMemUsage] = createSignal(87);
  const [diskUsage, setDiskUsage] = createSignal(32);
  const [healthScore, setHealthScore] = createSignal(87);
  const [uptime] = createSignal("3d 14h 23m");

  let canvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;

  const updateTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    setCurrentTime(`${h}:${m}`);
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    setCurrentDate(`${month}月${day}日 星期${weekdays[now.getDay()]}`);
    const hours = now.getHours();
    if (hours < 6) setGreeting("夜深了，管理员 🌙");
    else if (hours < 12) setGreeting("早安，管理员 👋");
    else if (hours < 18) setGreeting("下午好，管理员 ☀️");
    else setGreeting("晚上好，管理员 🌆");
  };

  // Mock data
  const nodes = createMemo<NodeInfo[]>(() => [
    { name: "日本节点02", protocol: "VLESS", delay: 28, load: 32, status: "online", flag: "🇯🇵", traffic: 98.21e9, region: "日本" },
    { name: "新加坡节点03", protocol: "Trojan", delay: 45, load: 28, status: "online", flag: "🇸🇬", traffic: 76.42e9, region: "新加坡" },
    { name: "美国节点04", protocol: "VMess", delay: 156, load: 45, status: "online", flag: "🇺🇸", traffic: 54.61e9, region: "美国" },
    { name: "香港节点01", protocol: "VLESS", delay: 32, load: 18, status: "online", flag: "🇭🇰", traffic: 32.18e9, region: "香港" },
    { name: "德国节点05", protocol: "Shadowsocks", delay: 210, load: 72, status: "warning", flag: "🇩🇪", traffic: 17.39e9, region: "德国" },
    { name: "英国节点06", protocol: "VMess", delay: "-", load: 0, status: "offline", flag: "🇬🇧", traffic: 0, region: "英国" },
  ]);

  const protocols = createMemo<ProtocolStat[]>(() => [
    { name: "VMess", percentage: 42.3, traffic: 118.01e9, color: "#FF6B6B" },
    { name: "VLESS", percentage: 28.7, traffic: 80.01e9, color: "#5B8CFF" },
    { name: "Trojan", percentage: 17.1, traffic: 47.61e9, color: "#00C48C" },
    { name: "Shadowsocks", percentage: 8.9, traffic: 24.78e9, color: "#FFB800" },
    { name: "其他", percentage: 3.0, traffic: 8.40e9, color: "#A855F7" },
  ]);

  const connections = createMemo<ConnectionInfo[]>(() => [
    { time: "2024-05-19 15:30:22", clientIp: "192.168.1.100", node: "日本节点02", protocol: "VLESS", upload: 2.45e6, download: 12.45e6, status: "connected" },
    { time: "2024-05-19 15:28:15", clientIp: "192.168.1.101", node: "新加坡节点03", protocol: "Trojan", upload: 1.23e6, download: 8.67e6, status: "connected" },
    { time: "2024-05-19 15:25:03", clientIp: "192.168.1.102", node: "美国节点04", protocol: "VMess", upload: 5.67e6, download: 23.45e6, status: "connected" },
    { time: "2024-05-19 15:23:11", clientIp: "192.168.1.104", node: "香港节点01", protocol: "VLESS", upload: 0.89e6, download: 4.56e6, status: "connected" },
    { time: "2024-05-19 15:20:45", clientIp: "192.168.1.100", node: "日本节点02", protocol: "VLESS", upload: 3.21e6, download: 15.78e6, status: "connected" },
  ]);

  const topNodes = createMemo(() =>
    [...nodes()].filter((n) => n.traffic > 0).sort((a, b) => b.traffic - a.traffic).slice(0, 5)
  );

  const hourlyTraffic = createMemo(() => {
    const data: { hour: string; up: number; down: number }[] = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        hour: `${String(i).padStart(2, "0")}:00`,
        up: Math.random() * 15 + 2,
        down: Math.random() * 40 + 10,
      });
    }
    return data;
  });

  onMount(async () => {
    if (clash.config()) setMode(clash.config()?.mode || "rule");
    updateTime();
    const timeTimer = setInterval(updateTime, 10000);
    connectTrafficWs();

    const unsub = wsManager.onStateChange(() => setWsState(wsManager.trafficState));

    onCleanup(() => {
      unsub();
      clearInterval(timeTimer);
      wsManager.disconnectTraffic();
    });
  });

  const connectTrafficWs = () => {
    wsManager.connectTraffic((data) => {
      setUpSpeed(data.up || 0);
      setDownSpeed(data.down || 0);
      setTrafficHistory((prev) => {
        const next = [...prev, { up: data.up || 0, down: data.down || 0 }];
        return next.length > 180 ? next.slice(-180) : next;
      });
    });
  };

  // Traffic canvas chart
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
      ctx.strokeStyle = "#F0F0F0";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Y-axis labels
      ctx.fillStyle = "#999999";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        const val = ((4 - i) / 4) * maxVal;
        ctx.fillText(formatSpeed(val), 36, y + 4);
      }

      const drawLine = (key: "up" | "down", color: string, fillColor: string) => {
        ctx!.beginPath();
        ctx!.moveTo(40, ch);
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = 40 + ((cw - 40) / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          ctx!.lineTo(x, y);
        }
        ctx!.lineTo(cw, ch);
        ctx!.lineTo(40, ch);
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
          const x = 40 + ((cw - 40) / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = color;
        ctx!.lineWidth = 2;
        ctx!.stroke();
      };

      drawLine("down", "#5B8CFF", "rgba(91, 140, 255, 0.10)");
      drawLine("up", "#FF6B6B", "rgba(255, 107, 107, 0.10)");

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    onCleanup(() => cancelAnimationFrame(animFrame));
  });

  // Protocol pie chart
  const ProtocolPieChart = () => {
    const data = protocols();
    const total = data.reduce((s, p) => s + p.traffic, 0);
    let acc = 0;
    const r = 55;
    const cx = 65;
    const cy = 65;

    const arcs = data.map((p) => {
      const startAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
      acc += p.traffic;
      const endAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...p, path };
    });

    return (
      <div class="flex items-start gap-6">
        <svg width="130" height="130" viewBox="0 0 130 130" class="flex-shrink-0">
          <For each={arcs}>
            {(arc) => <path d={arc.path} fill={arc.color} stroke="white" stroke-width="2" />}
          </For>
          <circle cx={cx} cy={cy} r="30" fill="white" />
          <text x={cx} y={cy - 4} text-anchor="middle" font-size="12" font-weight="600" fill="#333333">
            {formatBytes(total)}
          </text>
          <text x={cx} y={cy + 10} text-anchor="middle" font-size="9" fill="#999999">
            总流量
          </text>
        </svg>
        <div class="flex flex-col gap-2.5 flex-1 pt-1">
          <For each={data}>
            {(p) => (
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ "background-color": p.color }} />
                <span class="text-xs text-[#666] flex-1">{p.name}</span>
                <span class="text-xs font-medium text-[#333]">{p.percentage}%</span>
                <span class="text-xs text-[#999] w-16 text-right">{formatBytes(p.traffic)}</span>
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
    const barH = 130;

    return (
      <div class="flex flex-col">
        <div class="flex items-end gap-1.5" style={{ height: `${barH + 20}px` }}>
          <div class="flex flex-col justify-between h-full pr-2 text-right" style={{ width: "36px" }}>
            <For each={["50MB/s", "40MB/s", "30MB/s", "20MB/s", "10MB/s", "0"]}>
              {(label) => <span class="text-[10px] text-[#999] leading-none">{label}</span>}
            </For>
          </div>
          <For each={data}>
            {(d) => {
              const downH = (d.down / maxVal) * barH;
              const upH = (d.up / maxVal) * barH;
              return (
                <div class="flex-1 flex flex-col items-center gap-0.5 group">
                  <div class="flex gap-0.5 items-end" style={{ height: `${barH}px` }}>
                    <div
                      class="w-3 rounded-t-sm transition-opacity group-hover:opacity-80"
                      style={{ height: `${downH}px`, "background-color": "#5B8CFF" }}
                    />
                    <div
                      class="w-3 rounded-t-sm transition-opacity group-hover:opacity-80"
                      style={{ height: `${upH}px`, "background-color": "#FF6B6B" }}
                    />
                  </div>
                </div>
              );
            }}
          </For>
        </div>
        <div class="flex gap-1.5 ml-[36px] mt-1">
          <For each={data}>
            {(d) => (
              <div class="flex-1 text-center">
                <span class="text-[9px] text-[#999]">{d.hour.slice(0, 2)}</span>
              </div>
            )}
          </For>
        </div>
      </div>
    );
  };

  // Delay color
  const delayColor = (delay: number | string) => {
    if (typeof delay === "string") return "#999";
    if (delay < 50) return "#00C48C";
    if (delay < 100) return "#5B8CFF";
    if (delay < 200) return "#FFB800";
    return "#FF4757";
  };

  const delayBarColor = (delay: number | string) => {
    if (typeof delay === "string") return "#F0F0F0";
    if (delay < 50) return "#00C48C";
    if (delay < 100) return "#5B8CFF";
    if (delay < 200) return "#FFB800";
    return "#FF4757";
  };

  const statusColor = (status: string) => {
    if (status === "online") return "#00C48C";
    if (status === "warning") return "#FFB800";
    return "#FF4757";
  };

  // Stat card icon circle
  const StatIcon = (props: { icon: any; bgColor: string; iconColor: string }) => {
    const Icon = props.icon;
    return (
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ "background-color": props.bgColor }}
      >
        <Icon size={20} style={{ color: props.iconColor }} />
      </div>
    );
  };

  // 当前连接地区信息（自动根据 VPN 节点识别）
  const currentRegion = createMemo(() => {
    const code = detectRegion(activeNode());
    return SCENES[code] || SCENES.DEFAULT;
  });

  return (
    <div class="animate-page-in-enhanced space-y-5">
      {/* Header */}
      <Header breadcrumb="仪表盘" />
      {/* ===== Top: Greeting + Weather ===== */}
      <div class="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: Greeting */}
        <div>
          <h1 style={{ "font-size": "20px", "font-weight": "600", color: "#333" }}>{greeting()}</h1>
          <p style={{ "font-size": "14px", color: "#666", "margin-top": "4px" }}>
            一切运行正常，祝你有美好的一天！
          </p>
          <div class="flex items-center gap-2 mt-3">
            <div
              class="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "#F0F9F6" }}
            >
              <CheckCircle size={16} style={{ color: "#00C48C" }} />
              <span style={{ "font-size": "14px", color: "#333" }}>已连接：{activeNode() || "未连接"}</span>
            </div>
          </div>
        </div>

        {/* Right: Weather/Region card */}
        <div class="card bg-base-100 p-5 flex-shrink-0" style={{ "min-width": "200px" }}>
          <div style={{ "font-size": "12px", color: "#999" }}>🌍 当前地区</div>
          <div style={{ "font-size": "14px", "font-weight": "500", color: "#333", "margin-top": "4px" }}>
            {currentRegion().flag} {currentRegion().label}
          </div>
          <div style={{ "font-size": "24px", "font-weight": "700", color: "#333", "margin-top": "8px" }}>
            {currentTime()}
          </div>
          <div style={{ "font-size": "12px", color: "#999" }}>{currentDate()}</div>
          <div class="flex items-center gap-1.5 mt-2">
            <span style={{ "font-size": "16px" }}>☀️</span>
            <span style={{ "font-size": "14px", color: "#333" }}>23°C</span>
            <span style={{ "font-size": "12px", color: "#999" }}>晴朗</span>
          </div>
        </div>
      </div>

      {/* ===== 4 Stat Cards ===== */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Upload */}
        <div class="stat-card card bg-base-100 p-6 animate-card-spring">
          <div class="flex items-start justify-between">
            <div>
              <div style={{ "font-size": "14px", color: "#999" }}>总上传</div>
              <div style={{ "font-size": "28px", "font-weight": "700", color: "#333", "margin-top": "4px" }}>
                {formatBytes(totalUp())}
              </div>
              <div class="flex items-center gap-1 mt-2">
                <TrendingUp size={12} style={{ color: "#00C48C" }} />
                <span style={{ "font-size": "12px", color: "#00C48C" }}>↑12.5% 较昨日</span>
              </div>
            </div>
            <StatIcon icon={ArrowUp} bgColor="#FFE5E5" iconColor="#FF6B6B" />
          </div>
        </div>

        {/* Total Download */}
        <div class="stat-card card bg-base-100 p-6 animate-card-spring stagger-1">
          <div class="flex items-start justify-between">
            <div>
              <div style={{ "font-size": "14px", color: "#999" }}>总下载</div>
              <div style={{ "font-size": "28px", "font-weight": "700", color: "#333", "margin-top": "4px" }}>
                {formatBytes(totalDown())}
              </div>
              <div class="flex items-center gap-1 mt-2">
                <TrendingUp size={12} style={{ color: "#00C48C" }} />
                <span style={{ "font-size": "12px", color: "#00C48C" }}>↑8.3% 较昨日</span>
              </div>
            </div>
            <StatIcon icon={ArrowDown} bgColor="#E5F0FF" iconColor="#5B8CFF" />
          </div>
        </div>

        {/* Active Connections */}
        <div class="stat-card card bg-base-100 p-6 animate-card-spring stagger-2">
          <div class="flex items-start justify-between">
            <div>
              <div style={{ "font-size": "14px", color: "#999" }}>活跃连接</div>
              <div style={{ "font-size": "28px", "font-weight": "700", color: "#333", "margin-top": "4px" }}>
                {connCount()}
              </div>
              <div class="flex items-center gap-1 mt-2">
                <TrendingUp size={12} style={{ color: "#00C48C" }} />
                <span style={{ "font-size": "12px", color: "#00C48C" }}>↑15.2% 较昨日</span>
              </div>
            </div>
            <StatIcon icon={Activity} bgColor="#F5E5FF" iconColor="#A855F7" />
          </div>
        </div>

        {/* Uptime */}
        <div class="stat-card card bg-base-100 p-6 animate-card-spring stagger-3">
          <div class="flex items-start justify-between">
            <div>
              <div style={{ "font-size": "14px", color: "#999" }}>运行时间</div>
              <div style={{ "font-size": "28px", "font-weight": "700", color: "#333", "margin-top": "4px" }}>
                {uptime()}
              </div>
              <div style={{ "font-size": "12px", color: "#999", "margin-top": "8px" }}>
                系统运行稳定
              </div>
            </div>
            <StatIcon icon={Heart} bgColor="#E5FFFE" iconColor="#00C4C4" />
          </div>
        </div>
      </div>

      {/* ===== Traffic Trend Chart ===== */}
      <div class="card bg-base-100 animate-card-spring">
        <div class="flex items-center justify-between p-6 pb-4">
          <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>流量趋势</span>
          <div class="flex items-center gap-4">
            <select
              class="bg-[#F5F5F5] text-xs px-3 py-1.5 rounded-lg border-none outline-none"
              style={{ color: "#666" }}
            >
              <option>按小时</option>
              <option>按天</option>
              <option>按周</option>
            </select>
            <div class="flex items-center gap-4 text-xs" style={{ color: "#666" }}>
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 rounded-full" style={{ background: "#5B8CFF" }} />
                下载 (B/s)
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 rounded-full" style={{ background: "#FF6B6B" }} />
                上传 (B/s)
              </span>
            </div>
          </div>
        </div>
        <div class="px-6 pb-6" style={{ height: "260px" }}>
          <canvas ref={canvasRef} class="w-full h-full" />
        </div>
      </div>

      {/* ===== Two Columns: Node Status + Protocol ===== */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Node Status */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-6 pb-4">
            <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>节点状态</span>
            <button class="text-xs cursor-pointer hover:underline" style={{ color: "#534BFF" }}>
              查看全部
            </button>
          </div>
          <div class="px-4 pb-4">
            <For each={nodes()}>
              {(node) => (
                <div
                  class="flex items-center gap-3 px-3 py-3.5 rounded-lg hover:bg-[#F7F8FA] transition-colors"
                  style={{ "border-bottom": "1px solid #F0F0F0" }}
                >
                  <span
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ "background-color": statusColor(node.status) }}
                  />
                  <div class="flex-1 min-w-0">
                    <div style={{ "font-size": "14px", "font-weight": "500", color: "#333" }}>
                      {node.name} ({node.region})
                    </div>
                    <div style={{ "font-size": "12px", color: "#999", "margin-top": "2px" }}>
                      {node.protocol} | {node.region} | 负载 {node.load}%
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div style={{ "font-size": "12px", color: delayColor(node.delay) }}>
                      {typeof node.delay === "number" ? `${node.delay} ms` : node.delay}
                    </div>
                    <div class="mt-1 h-1 rounded-full overflow-hidden" style={{ width: "60px", background: "#F0F0F0" }}>
                      <div
                        class="h-full rounded-full"
                        style={{
                          width: `${typeof node.delay === "number" ? Math.min(100, node.delay / 2) : 0}%`,
                          "background-color": delayBarColor(node.delay),
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </For>
            <div class="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg" style={{ background: "#F7F8FA" }}>
              <span class="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#F0F0F0" }} />
              <span style={{ "font-size": "14px", color: "#999", flex: 1 }}>全部节点</span>
              <span style={{ "font-size": "12px", color: "#999" }}>{nodes().length} 个</span>
            </div>
          </div>
        </div>

        {/* Protocol Usage */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-6 pb-4">
            <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>协议使用情况</span>
          </div>
          <div class="px-6 pb-6">
            <ProtocolPieChart />
          </div>
        </div>
      </div>

      {/* ===== Two Columns: Traffic Stats + Top 5 ===== */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Traffic Stats Bar Chart */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-6 pb-4">
            <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>流量统计</span>
            <div class="flex items-center gap-4 text-xs" style={{ color: "#666" }}>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm" style={{ background: "#FF6B6B" }} />
                上传流量
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm" style={{ background: "#5B8CFF" }} />
                下载流量
              </span>
            </div>
          </div>
          <div class="px-6 pb-6">
            <TrafficBarChart />
          </div>
        </div>

        {/* Top 5 Nodes */}
        <div class="card bg-base-100 animate-card-spring">
          <div class="flex items-center justify-between p-6 pb-4">
            <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>各节点流量 TOP5</span>
          </div>
          <div class="px-4 pb-4">
            {/* Header */}
            <div class="flex items-center gap-3 px-3 pb-2" style={{ "border-bottom": "1px solid #F0F0F0" }}>
              <span style={{ "font-size": "12px", color: "#999", width: "40px" }}>排行</span>
              <span style={{ "font-size": "12px", color: "#999", flex: 1 }}>节点</span>
              <span style={{ "font-size": "12px", color: "#999", width: "80px", "text-align": "right" }}>流量</span>
            </div>
            <For each={topNodes()}>
              {(node, i) => {
                const colors = ["#534BFF", "#A855F7", "#FFB800", "#00C48C", "#FF4757"];
                const maxTraffic = topNodes()[0]?.traffic || 1;
                const barWidth = (node.traffic / maxTraffic) * 100;
                return (
                  <div class="flex items-center gap-3 px-3 py-3" style={{ "border-bottom": "1px solid #F0F0F0" }}>
                    <span
                      style={{
                        "font-size": "12px",
                        "font-weight": "600",
                        color: colors[i()],
                        width: "40px",
                      }}
                    >
                      {i() + 1}
                    </span>
                    <div class="flex-1 min-w-0">
                      <div style={{ "font-size": "12px", color: "#333" }}>{node.name}</div>
                      <div class="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%`, "background-color": colors[i()] }}
                        />
                      </div>
                    </div>
                    <span style={{ "font-size": "12px", color: "#333", width: "80px", "text-align": "right" }}>
                      {formatBytes(node.traffic)}
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      {/* ===== Latest Connections ===== */}
      <div class="card bg-base-100 animate-card-spring">
        <div class="flex items-center justify-between p-6 pb-4">
          <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>最新连接</span>
          <button class="text-xs cursor-pointer hover:underline" style={{ color: "#534BFF" }}>
            查看全部
          </button>
        </div>
        <div class="overflow-x-auto px-4 pb-4">
          <table class="w-full">
            <thead>
              <tr>
                <For each={["时间", "客户端IP", "节点", "协议", "上传", "下载", "状态"]}>
                  {(h) => (
                    <th
                      class="text-left pb-3 font-normal"
                      style={{ "font-size": "12px", color: "#999", padding: "0 8px" }}
                    >
                      {h}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={connections()}>
                {(conn) => (
                  <tr class="hover:bg-[#F7F8FA] transition-colors" style={{ height: "48px" }}>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>{conn.time}</td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>{conn.clientIp}</td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>{conn.node}</td>
                    <td style={{ padding: "0 8px" }}>
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "#F5F5F5", color: "#666", "font-size": "11px" }}
                      >
                        {conn.protocol}
                      </span>
                    </td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>
                      {formatBytes(conn.upload)}
                    </td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>
                      {formatBytes(conn.download)}
                    </td>
                    <td style={{ padding: "0 8px" }}>
                      <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full animate-subtle-pulse" style={{ background: "#00C48C" }} />
                        <span style={{ "font-size": "12px", color: "#00C48C" }}>活跃</span>
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div class="flex items-center justify-center gap-1.5 px-6 py-3" style={{ "border-top": "1px solid #F0F0F0" }}>
          <button class="w-7 h-7 rounded flex items-center justify-center text-xs" style={{ color: "#999" }}>&lt;</button>
          <For each={[1, 2, 3]}>
            {(p) => (
              <button
                class="w-7 h-7 rounded flex items-center justify-center text-xs font-medium"
                style={p === 1 ? { color: "#534BFF", "border-bottom": "2px solid #534BFF" } : { color: "#666" }}
              >
                {p}
              </button>
            )}
          </For>
          <span class="text-xs" style={{ color: "#999" }}>...</span>
          <button class="w-7 h-7 rounded flex items-center justify-center text-xs" style={{ color: "#666" }}>20</button>
          <button class="w-7 h-7 rounded flex items-center justify-center text-xs" style={{ color: "#999" }}>&gt;</button>
        </div>
      </div>

      {/* ===== System Status ===== */}
      <div class="card bg-base-100 animate-card-spring">
        <div class="flex items-center justify-between p-6 pb-4">
          <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>系统状态</span>
          <span style={{ "font-size": "12px", color: "#999" }}>运行时间: {uptime()}</span>
        </div>
        <div class="px-6 pb-6 flex flex-col md:flex-row items-center gap-10">
          {/* Health ring */}
          <div class="flex flex-col items-center flex-shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#F0F0F0" stroke-width="6" />
              <circle
                cx="60" cy="60" r="48" fill="none"
                stroke="#534BFF"
                stroke-width="6"
                stroke-linecap="round"
                stroke-dasharray={2 * Math.PI * 48}
                stroke-dashoffset={2 * Math.PI * 48 * (1 - healthScore() / 100)}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
              <text x="60" y="54" text-anchor="middle" font-size="28" font-weight="700" fill="#333">
                {Math.round(healthScore())}%
              </text>
              <text x="60" y="72" text-anchor="middle" font-size="12" fill="#999">
                健康度
              </text>
            </svg>
          </div>

          {/* Bars */}
          <div class="flex-1 space-y-5 w-full">
            <For each={[
              { label: "CPU使用率", value: cpuUsage(), color: "#534BFF", icon: Cpu },
              { label: "内存使用率", value: memUsage(), color: "#FFB800", icon: Monitor },
              { label: "磁盘使用率", value: diskUsage(), color: "#00C48C", icon: HardDrive },
            ]}>
              {(item) => {
                const Icon = item.icon;
                return (
                  <div class="flex items-center gap-3">
                    <Icon size={14} style={{ color: item.color, "flex-shrink": "0" }} />
                    <span style={{ "font-size": "12px", color: "#666", width: "70px" }}>{item.label}</span>
                    <div class="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.value}%`, "background-color": item.color }}
                      />
                    </div>
                    <span style={{ "font-size": "12px", color: "#333", width: "36px", "text-align": "right" }}>
                      {Math.round(item.value)}%
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer class="py-6 text-center" style={{ color: "var(--color-hyperion-text-muted)" }}>
        <p class="text-sm">© 2024 Hyperion. All rights reserved.</p>
      </footer>
    </div>
  );
}
