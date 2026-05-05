import { createMemo } from "solid-js";
import { CheckCircle } from "lucide-solid";
import { activeNode } from "@/stores/activeNode";
import { detectRegion, SCENES } from "@/components/scenic/ScenicBackdrop";

interface HeroBannerProps {
  greeting: string;
  currentTime: string;
  currentDate: string;
}

export default function HeroBanner(props: HeroBannerProps) {
  const currentRegion = createMemo(() => {
    const code = detectRegion(activeNode());
    return SCENES[code] || SCENES.DEFAULT;
  });

  return (
    <div class="flex items-start justify-between gap-4 flex-wrap">
      {/* Left: Greeting */}
      <div>
        <h1 style={{ "font-size": "20px", "font-weight": "600", color: "#333" }}>
          {props.greeting}
        </h1>
        <p style={{ "font-size": "14px", color: "#666", "margin-top": "4px" }}>
          一切运行正常，祝你有美好的一天！
        </p>
        <div class="flex items-center gap-2 mt-3">
          <div class="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "#F0F9F6" }}>
            <CheckCircle size={16} style={{ color: "#00C48C" }} />
            <span style={{ "font-size": "14px", color: "#333" }}>
              已连接：{activeNode() || "未连接"}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Region / Weather card */}
      <div class="card bg-base-100 p-5 flex-shrink-0" style={{ "min-width": "200px" }}>
        <div style={{ "font-size": "12px", color: "#999" }}>🌍 当前地区</div>
        <div style={{ "font-size": "14px", "font-weight": "500", color: "#333", "margin-top": "4px" }}>
          {currentRegion().flag} {currentRegion().label}
        </div>
        <div style={{ "font-size": "24px", "font-weight": "700", color: "#333", "margin-top": "8px" }}>
          {props.currentTime}
        </div>
        <div style={{ "font-size": "12px", color: "#999" }}>{props.currentDate}</div>
        <div class="flex items-center gap-1.5 mt-2">
          <span style={{ "font-size": "16px" }}>☀️</span>
          <span style={{ "font-size": "14px", color: "#333" }}>23°C</span>
          <span style={{ "font-size": "12px", color: "#999" }}>晴朗</span>
        </div>
      </div>
    </div>
  );
}
