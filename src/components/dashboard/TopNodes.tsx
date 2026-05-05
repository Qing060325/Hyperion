import { For } from "solid-js";
import { formatBytes } from "@/utils/format";

interface NodeInfo {
  name: string;
  traffic: number;
  [key: string]: any;
}

interface Props {
  nodes: () => NodeInfo[];
}

export default function TopNodes(props: Props) {
  const colors = ["#534BFF", "#A855F7", "#FFB800", "#00C48C", "#FF4757"];

  return (
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
        <For each={props.nodes()}>
          {(node, i) => {
            const maxTraffic = () => props.nodes()[0]?.traffic || 1;
            const barWidth = () => (node.traffic / maxTraffic()) * 100;
            return (
              <div class="flex items-center gap-3 px-3 py-3" style={{ "border-bottom": "1px solid #F0F0F0" }}>
                <span
                  style={{
                    "font-size": "12px",
                    "font-weight": "600",
                    color: colors[i()] || "#999",
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
                      style={{ width: `${barWidth()}%`, "background-color": colors[i()] || "#999" }}
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
  );
}
