import type { JSX } from "solid-js";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: (p: { size?: number; style?: JSX.CSSProperties }) => JSX.Element;
  iconBg: string;
  iconColor: string;
  /** 用于 stagger 动画 */
  index?: number;
}

export default function StatCard(props: StatCardProps) {
  const staggerClass = () => {
    const i = props.index ?? 0;
    return i > 0 ? `stagger-${i}` : "";
  };

  return (
    <div class={`stat-card card bg-base-100 p-6 animate-card-spring ${staggerClass()}`}>
      <div class="flex items-start justify-between">
        <div>
          <div style={{ "font-size": "14px", color: "#999" }}>{props.label}</div>
          <div style={{ "font-size": "28px", "font-weight": "700", color: "#333", "margin-top": "4px" }}>
            {props.value}
          </div>
          {props.trend && (
            <div class="flex items-center gap-1 mt-2">
              <span
                style={{
                  "font-size": "12px",
                  color: props.trendUp !== false ? "#00C48C" : "#FF4757",
                }}
              >
                {props.trend}
              </span>
            </div>
          )}
        </div>
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ "background-color": props.iconBg }}
        >
          <props.icon size={20} style={{ color: props.iconColor }} />
        </div>
      </div>
    </div>
  );
}
