import { For, createMemo } from "solid-js";

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

interface Props {
  nodes: () => NodeInfo[];
}

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

export default function NodeStatusList(props: Props) {
  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>节点状态</span>
        <button class="text-xs cursor-pointer hover:underline" style={{ color: "#534BFF" }}>
          查看全部
        </button>
      </div>
      <div class="px-4 pb-4">
        <For each={props.nodes()}>
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
          <span style={{ "font-size": "12px", color: "#999" }}>{props.nodes().length} 个</span>
        </div>
      </div>
    </div>
  );
}
