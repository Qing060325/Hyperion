import { createMemo } from "solid-js";
import { CheckCircle, Globe, Clock, Cloud } from "lucide-solid";
import { activeNode } from "@/stores/activeNode";
import { useSceneStore } from "@/stores/scene";
import { useClashStore } from "@/stores/clash";

interface HeroBannerProps {
  greeting: string;
  currentTime: string;
  currentDate: string;
}

export default function HeroBanner(props: HeroBannerProps) {
  const scene = useSceneStore();
  const clash = useClashStore();

  /** 场景切换时的过渡样式 */
  const heroStyle = createMemo(() => ({
    "--hero-accent": scene.themeColor(),
    transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  }));

  /** 连接状态 */
  const isConnected = createMemo(() => clash.connected());

  /** 延迟（从 clash config 推断） */
  const nodeDelay = createMemo(() => {
    // mock — 实际应从 proxy API 获取
    return "28ms";
  });

  return (
    <div
      class={`hero-banner scene-aware ${scene.transitioning() ? "hero-transitioning" : ""}`}
      style={heroStyle()}
    >
      {/* 左侧：问候 + 场景信息 */}
      <div class="hero-content">
        {/* 问候语 */}
        <h1 class="hero-greeting">{props.greeting}</h1>

        {/* 场景状态行 */}
        <div class="hero-scene-info">
          {/* 连接状态 */}
          <div class="hero-status-pill" style={{
            background: isConnected() ? "#F0F9F6" : "#FFF0F0",
          }}>
            <CheckCircle size={14} style={{ color: isConnected() ? "#00C48C" : "#FF4757" }} />
            <span style={{ color: isConnected() ? "#00C48C" : "#FF4757" }}>
              {isConnected() ? "已连接" : "未连接"}
            </span>
          </div>

          {/* 当前节点 + 地区 */}
          <div class="hero-node-pill">
            <span class="hero-node-flag">{scene.flag()}</span>
            <span>{activeNode() || "未选择节点"}</span>
            <span class="hero-node-delay">{nodeDelay()}</span>
          </div>
        </div>

        {/* 场景描述 */}
        <p class="hero-subtitle">
          {scene.regionLabel()} · {scene.isNight() ? "夜间模式已启用" : "一切运行正常"}
        </p>
      </div>

      {/* 右侧：时间 + 场景卡片 */}
      <div class="hero-scene-card">
        {/* 地区 */}
        <div class="hero-card-row">
          <Globe size={13} style={{ color: "#999" }} />
          <span class="hero-card-label">当前地区</span>
        </div>
        <div class="hero-card-region">
          <span class="hero-card-flag">{scene.flag()}</span>
          <span>{scene.regionLabel()}</span>
        </div>

        {/* 时间 */}
        <div class="hero-card-time">{props.currentTime}</div>
        <div class="hero-card-date">{props.currentDate}</div>

        {/* 时段指示 */}
        <div class="hero-card-row" style={{ "margin-top": "8px" }}>
          <Clock size={13} style={{ color: scene.themeColor() }} />
          <span style={{ color: "#666" }}>
            {scene.isNight() ? "🌙 夜间" : scene.isTwilight() ? "🌅 晨昏" : "☀️ 白天"}
          </span>
        </div>

        {/* 主题色条 */}
        <div
          class="hero-accent-bar"
          style={{ background: `linear-gradient(90deg, ${scene.themeColor()}, transparent)` }}
        />
      </div>
    </div>
  );
}
