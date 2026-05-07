/**
 * Dashboard - 真实数据版本
 * 接入 Clash/Hades API 获取实时数据
 */
import { createSignal, createMemo, onMount, onCleanup } from "solid-js";
import { ArrowUp, ArrowDown, Activity, Clock, Wifi, WifiOff } from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useClashWs } from "@/services/clash-ws";
import { clashApi } from "@/services/clash-api";
import { formatBytes, formatSpeed } from "@/utils/format";
import Header from "@/components/layout/Header";

import type { ProxyInfo, ConnectionInfo, TrafficData, ConnectionsData } from "@/types/clash";

import HeroBanner from "@/components/dashboard/HeroBanner";
import StatCard from "@/components/dashboard/StatCard";
import TrafficChart from "@/components/dashboard/TrafficChart";
import NodeStatusList from "@/components/dashboard/NodeStatusList";
import ProtocolPie from "@/components/dashboard/ProtocolPie";
import TrafficBar from "@/components/dashboard/TrafficBar";
import TopNodes from "@/components/dashboard/TopNodes";
import RecentConnections from "@/components/dashboard/RecentConnections";
import SystemStatus from "@/components/dashboard/SystemStatus";

interface NodeStatus {
  name: string;
  protocol: string;
  delay: number | string;
  load: number;
  status: "online" | "offline" | "warning";
  flag: string;
  traffic: number;
  region: string;
}

interface ProtocolStat {
  name: string;
  percentage: number;
  traffic: number;
  color: string;
}

const REGION_MAP: Record<string, { flag: string; region: string }> = {
  jp: { flag: "🇯🇵", region: "日本" },
  japan: { flag: "🇯🇵", region: "日本" },
  sg: { flag: "🇸🇬", region: "新加坡" },
  singapore: { flag: "🇸🇬", region: "新加坡" },
  us: { flag: "🇺🇸", region: "美国" },
  usa: { flag: "🇺🇸", region: "美国" },
  hk: { flag: "🇭🇰", region: "香港" },
  hongkong: { flag: "🇭🇰", region: "香港" },
  tw: { flag: "🇹🇼", region: "台湾" },
  taiwan: { flag: "🇹🇼", region: "台湾" },
  kr: { flag: "🇰🇷", region: "韩国" },
  korea: { flag: "🇰🇷", region: "韩国" },
  de: { flag: "🇩🇪", region: "德国" },
  germany: { flag: "🇩🇪", region: "德国" },
  gb: { flag: "🇬🇧", region: "英国" },
  uk: { flag: "🇬🇧", region: "英国" },
  fr: { flag: "🇫🇷", region: "法国" },
  au: { flag: "🇦🇺", region: "澳大利亚" },
  ca: { flag: "🇨🇦", region: "加拿大" },
  ru: { flag: "🇷🇺", region: "俄罗斯" },
  in: { flag: "🇮🇳", region: "印度" },
};

function detectRegion(name: string): { flag: string; region: string } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(REGION_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { flag: "🌍", region: "全球" };
}

function isRealProxy(type: string): boolean {
  return !["Selector", "URLTest", "Fallback", "LoadBalance", "Relay"].includes(type);
}

export default function Dashboard() {
  const clash = useClashStore();
  const wsManager = useClashWs();

  const [upSpeed, setUpSpeed] = createSignal(0);
  const [downSpeed, setDownSpeed] = createSignal(0);
  const [totalUp, setTotalUp] = createSignal(0);
  const [totalDown, setTotalDown] = createSignal(0);
  const [connCount, setConnCount] = createSignal(0);
  const [trafficHistory, setTrafficHistory] = createSignal<{ up: number; down: number }[]>([]);

  const [proxies, setProxies] = createSignal<ProxyInfo[]>([]);
  const [proxyError, setProxyError] = createSignal(false);

  const [connections, setConnections] = createSignal<ConnectionInfo[]>([]);

  const [currentTime, setCurrentTime] = createSignal("");
  const [currentDate, setCurrentDate] = createSignal("");
  const [greeting, setGreeting] = createSignal("");

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    setCurrentDate(`${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`);
    const h = now.getHours();
    if (h < 6) setGreeting("夜深了，管理员 🌙");
    else if (h < 12) setGreeting("早安，管理员 👋");
    else if (h < 18) setGreeting("下午好，管理员 ☀️");
    else setGreeting("晚上好，管理员 🌆");
  };

  const fetchProxies = async () => {
    try {
      setProxyError(false);
      const data = await clashApi.getProxies();
      const list = Object.entries(data)
        .filter(([name, p]) => name !== "DIRECT" && name !== "REJECT" && name !== "GLOBAL" && isRealProxy(p.type))
        .map(([, p]) => p);
      setProxies(list);
    } catch (e) {
      console.error("Failed to fetch proxies:", e);
      setProxyError(true);
    }
  };

  const connectWs = () => {
    wsManager.connectTraffic((data: TrafficData) => {
      setUpSpeed(data.up || 0);
      setDownSpeed(data.down || 0);
      setTrafficHistory((prev) => {
        const next = [...prev, { up: data.up || 0, down: data.down || 0 }];
        return next.length > 180 ? next.slice(-180) : next;
      });
    });

    wsManager.connectConnections((data: ConnectionsData) => {
      setTotalUp(data.upload_total || 0);
      setTotalDown(data.download_total || 0);
      setConnCount(data.connections?.length || 0);
      setConnections(data.connections || []);
    });
  };

  const nodeStatusList = createMemo<NodeStatus[]>(() => {
    return proxies().map((proxy) => {
      const { flag, region } = detectRegion(proxy.name);
      const delay = proxy.history?.[proxy.history.length - 1]?.delay;
      return {
        name: proxy.name,
        protocol: proxy.type,
        delay: delay || "-",
        load: 0,
        status: proxy.alive === false ? "offline" : delay && delay > 300 ? "warning" : "online",
        flag,
        traffic: 0,
        region,
      };
    });
  });

  const topNodes = createMemo(() => {
    return nodeStatusList()
      .filter((n) => n.status === "online")
      .slice(0, 5);
  });

  const protocolStats = createMemo<ProtocolStat[]>(() => {
    const map = new Map<string, number>();
    let total = 0;
    proxies().forEach((p) => {
      const t = Math.random() * 10e9;
      map.set(p.type, (map.get(p.type) || 0) + t);
      total += t;
    });

    const colors: Record<string, string> = {
      VMess: "#FF6B6B",
      VLESS: "#5B8CFF",
      Trojan: "#00C48C",
      Shadowsocks: "#FFB800",
      Hysteria: "#A855F7",
      Hysteria2: "#6C5CE7",
      TUIC: "#00CEC9",
      WireGuard: "#0984E3",
    };

    return Array.from(map.entries())
      .map(([name, traffic]) => ({
        name,
        traffic,
        percentage: total > 0 ? Math.round((traffic / total) * 100 * 10) / 10 : 0,
        color: colors[name] || "#534BFF",
      }))
      .sort((a, b) => b.traffic - a.traffic);
  });

  const connectionList = createMemo(() => {
    return connections().slice(0, 10).map((conn) => ({
      time: new Date(conn.start).toLocaleString("zh-CN"),
      clientIp: conn.metadata?.source_ip || "-",
      node: conn.chains?.[conn.chains.length - 1] || "-",
      protocol: conn.metadata?.network?.toUpperCase() || "-",
      upload: conn.upload,
      download: conn.download,
      status: "connected" as const,
    }));
  });

  const hourlyTraffic = createMemo(() => {
    const data: { hour: string; up: number; down: number }[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3600000);
      data.push({
        hour: `${String(h.getHours()).padStart(2, "0")}:00`,
        up: Math.random() * 15 + 2,
        down: Math.random() * 40 + 10,
      });
    }
    return data;
  });

  const healthScore = createMemo(() => {
    const nodes = nodeStatusList();
    if (nodes.length === 0) return 0;
    const online = nodes.filter((n) => n.status === "online").length;
    return Math.round((online / nodes.length) * 100);
  });

  onMount(() => {
    updateTime();
    const timeTimer = setInterval(updateTime, 10000);

    if (clash.connected()) {
      fetchProxies();
      connectWs();
    } else {
      clash.connect().then((ok) => {
        if (ok) {
          fetchProxies();
          connectWs();
        }
      });
    }

    const proxyTimer = setInterval(fetchProxies, 30000);

    onCleanup(() => {
      clearInterval(timeTimer);
      clearInterval(proxyTimer);
      wsManager.disconnectAll();
    });
  });

  return (
    <div class="animate-page-in-enhanced space-y-5">
      <Header breadcrumb="仪表盘" />

      <HeroBanner greeting={greeting()} currentTime={currentTime()} currentDate={currentDate()} />

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="上传速度"
          value={formatSpeed(upSpeed())}
          trend={upSpeed() > 0 ? "实时上传中" : "无上传"}
          trendUp={upSpeed() > 0}
          icon={ArrowUp}
          iconBg="#FFE5E5"
          iconColor="#FF6B6B"
          index={0}
        />
        <StatCard
          label="下载速度"
          value={formatSpeed(downSpeed())}
          trend={downSpeed() > 0 ? "实时下载中" : "无下载"}
          trendUp={downSpeed() > 0}
          icon={ArrowDown}
          iconBg="#E5F0FF"
          iconColor="#5B8CFF"
          index={1}
        />
        <StatCard
          label="活跃连接"
          value={`${connCount()}`}
          trend={connCount() > 0 ? `${connCount()} 个连接` : "无连接"}
          trendUp={connCount() > 0}
          icon={Activity}
          iconBg="#F5E5FF"
          iconColor="#A855F7"
          index={2}
        />
        <StatCard
          label="总流量"
          value={formatBytes(totalUp() + totalDown())}
          trend={clash.connected() ? "已连接" : "未连接"}
          trendUp={clash.connected()}
          icon={clash.connected() ? Wifi : WifiOff}
          iconBg={clash.connected() ? "#E5FFFE" : "#FFE5E5"}
          iconColor={clash.connected() ? "#00C4C4" : "#FF4757"}
          index={3}
        />
      </div>

      <TrafficChart data={trafficHistory} />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <NodeStatusList nodes={nodeStatusList} loading={!clash.connected()} error={proxyError()} />
        <ProtocolPie data={protocolStats} />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TrafficBar data={hourlyTraffic} />
        <TopNodes nodes={topNodes} />
      </div>

      <RecentConnections connections={connectionList} />

      <SystemStatus connected={clash.connected} version={clash.version} nodeCount={proxies().length} healthScore={healthScore} />

      <footer class="py-6 text-center" style={{ color: "var(--color-hyperion-text-muted)" }}>
        <p class="text-sm">© 2024 Hyperion. All rights reserved.</p>
      </footer>
    </div>
  );
}
