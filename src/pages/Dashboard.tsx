import { createSignal, createMemo, onMount, onCleanup } from "solid-js";
import { ArrowUp, ArrowDown, Activity, Heart, TrendingUp } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs } from "@/services/clash-ws";
import { formatBytes } from "@/utils/format";
import Header from "@/components/layout/Header";

// Dashboard components
import HeroBanner from "@/components/dashboard/HeroBanner";
import StatCard from "@/components/dashboard/StatCard";
import TrafficChart from "@/components/dashboard/TrafficChart";
import NodeStatusList from "@/components/dashboard/NodeStatusList";
import ProtocolPie from "@/components/dashboard/ProtocolPie";
import TrafficBar from "@/components/dashboard/TrafficBar";
import TopNodes from "@/components/dashboard/TopNodes";
import RecentConnections from "@/components/dashboard/RecentConnections";
import SystemStatus from "@/components/dashboard/SystemStatus";

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

  // Traffic signals
  const [upSpeed, setUpSpeed] = createSignal(0);
  const [downSpeed, setDownSpeed] = createSignal(0);
  const [totalUp, setTotalUp] = createSignal(32.14e9);
  const [totalDown, setTotalDown] = createSignal(246.67e9);
  const [connCount, setConnCount] = createSignal(146);
  const [trafficHistory, setTrafficHistory] = createSignal<{ up: number; down: number }[]>([]);

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

  onMount(() => {
    updateTime();
    const timeTimer = setInterval(updateTime, 10000);
    connectTrafficWs();

    onCleanup(() => {
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

  return (
    <div class="animate-page-in-enhanced space-y-5">
      <Header breadcrumb="仪表盘" />

      <HeroBanner greeting={greeting()} currentTime={currentTime()} currentDate={currentDate()} />

      {/* 4 Stat Cards */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="总上传"
          value={formatBytes(totalUp())}
          trend="↑12.5% 较昨日"
          icon={ArrowUp}
          iconBg="#FFE5E5"
          iconColor="#FF6B6B"
          index={0}
        />
        <StatCard
          label="总下载"
          value={formatBytes(totalDown())}
          trend="↑8.3% 较昨日"
          icon={ArrowDown}
          iconBg="#E5F0FF"
          iconColor="#5B8CFF"
          index={1}
        />
        <StatCard
          label="活跃连接"
          value={`${connCount()}`}
          trend="↑15.2% 较昨日"
          icon={Activity}
          iconBg="#F5E5FF"
          iconColor="#A855F7"
          index={2}
        />
        <StatCard
          label="运行时间"
          value={uptime()}
          trend="系统运行稳定"
          icon={Heart}
          iconBg="#E5FFFE"
          iconColor="#00C4C4"
          index={3}
        />
      </div>

      {/* Traffic Trend */}
      <TrafficChart data={trafficHistory} />

      {/* Node Status + Protocol */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <NodeStatusList nodes={nodes} />
        <ProtocolPie data={protocols} />
      </div>

      {/* Traffic Stats + Top 5 */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TrafficBar data={hourlyTraffic} />
        <TopNodes nodes={topNodes} />
      </div>

      {/* Recent Connections */}
      <RecentConnections connections={connections} />

      {/* System Status */}
      <SystemStatus
        cpuUsage={cpuUsage}
        memUsage={memUsage}
        diskUsage={diskUsage}
        healthScore={healthScore}
        uptime={uptime}
      />

      {/* Footer */}
      <footer class="py-6 text-center" style={{ color: "var(--color-hyperion-text-muted)" }}>
        <p class="text-sm">© 2024 Hyperion. All rights reserved.</p>
      </footer>
    </div>
  );
}
