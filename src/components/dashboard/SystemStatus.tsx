import { Show, For } from "solid-js";
import { CheckCircle, XCircle, Server, Activity, Heart } from "lucide-solid";
import type { ClashVersion } from "@/types/clash";

interface SystemStatusProps {
  connected: () => boolean;
  version: () => ClashVersion | null;
  nodeCount: number;
  healthScore: () => number;
}

export default function SystemStatus(props: SystemStatusProps) {
  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>系统状态</span>
        <Show
          when={props.connected()}
          fallback={
            <span style={{ "font-size": "12px", color: "#FF4757" }}>未连接</span>
          }
        >
          <span style={{ "font-size": "12px", color: "#00C48C" }}>运行正常</span>
        </Show>
      </div>

      <div class="px-6 pb-6 flex flex-col md:flex-row items-center gap-10">
        <div class="flex flex-col items-center flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#F0F0F0" stroke-width="6" />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={props.connected() ? "#00C48C" : "#FF4757"}
              stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray={`${2 * Math.PI * 48}`}
              stroke-dashoffset={`${2 * Math.PI * 48 * (1 - props.healthScore() / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <text x="60" y="54" text-anchor="middle" font-size="28" font-weight="700" fill="#333">
              {Math.round(props.healthScore())}%
            </text>
            <text x="60" y="72" text-anchor="middle" font-size="12" fill="#999">
              健康度
            </text>
          </svg>
        </div>

        <div class="flex-1 space-y-5 w-full">
          <For
            each={[
              {
                label: "连接状态",
                value: props.connected() ? "已连接" : "未连接",
                color: props.connected() ? "#00C48C" : "#FF4757",
                icon: props.connected() ? CheckCircle : XCircle,
              },
              {
                label: "代理节点",
                value: `${props.nodeCount} 个`,
                color: "#5B8CFF",
                icon: Server,
              },
              {
                label: "内核版本",
                value: props.version()?.version || "-",
                color: "#FFB800",
                icon: Activity,
              },
            ]}
          >
            {(item) => {
              const Icon = item.icon;
              return (
                <div class="flex items-center gap-3">
                  <Icon size={14} style={{ color: item.color, "flex-shrink": "0" }} />
                  <span style={{ "font-size": "12px", color: "#666", width: "70px" }}>{item.label}</span>
                  <div class="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      style={{ width: "100%", "background-color": item.color, opacity: 0.3 }}
                    />
                  </div>
                  <span
                    style={{
                      "font-size": "12px",
                      color: item.color,
                      width: "80px",
                      "text-align": "right",
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
