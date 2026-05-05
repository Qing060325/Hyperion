import { For } from "solid-js";
import { Cpu, Monitor, HardDrive } from "lucide-solid";

interface SystemStatusProps {
  cpuUsage: () => number;
  memUsage: () => number;
  diskUsage: () => number;
  healthScore: () => number;
  uptime: () => string;
}

export default function SystemStatus(props: SystemStatusProps) {
  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>系统状态</span>
        <span style={{ "font-size": "12px", color: "#999" }}>运行时间: {props.uptime()}</span>
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
              stroke-dashoffset={2 * Math.PI * 48 * (1 - props.healthScore() / 100)}
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

        {/* Bars */}
        <div class="flex-1 space-y-5 w-full">
          <For each={[
            { label: "CPU使用率", value: props.cpuUsage(), color: "#534BFF", icon: Cpu },
            { label: "内存使用率", value: props.memUsage(), color: "#FFB800", icon: Monitor },
            { label: "磁盘使用率", value: props.diskUsage(), color: "#00C48C", icon: HardDrive },
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
  );
}
