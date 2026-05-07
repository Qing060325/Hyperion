import { For, Show } from "solid-js";
import { Loader2, AlertCircle } from "lucide-solid";

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

interface Props {
  nodes: () => NodeStatus[];
  loading?: boolean;
  error?: boolean;
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
        <Show when={!props.loading && !props.error}>
          <button class="text-xs cursor-pointer hover:underline" style={{ color: "#534BFF" }}>
            查看全部
          </button>
        </Show>
      </div>

      <div class="px-4 pb-4">
        <Show
          when={!props.loading && !props.error}
          fallback={
            <Show
              when={props.loading}
              fallback={
                <div class="flex flex-col items-center justify-center py-12 gap-3">
                  <AlertCircle size={32} style={{ color: "#FF4757" }} />
                  <span style={{ "font-size": "14px", color: "#999" }}>无法加载节点数据</span>
                  <span style={{ "font-size": "12px", color: "#999" }}>请检查 API 连接</span>
                </div>
              }
            >
              <div class="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={32} class="animate-spin" style={{ color: "#534BFF" }} />
                <span style={{ "font-size": "14px", color: "#999" }}>加载节点数据...</span>
              </div>
            </Show>
          }
        >
          <Show
            when={props.nodes().length > 0}
            fallback={
              <div class="flex flex-col items-center justify-center py-12">
                <span style={{ "font-size": "14px", color: "#999" }}>暂无代理节点</span>
              </div>
            }
          >
            <For each={props.nodes().slice(0, 6)}>
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
                      {node.name}
                    </div>
                    <div style={{ "font-size": "12px", color: "#999", "margin-top": "2px" }}>
                      {node.protocol} | {node.region}
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
          </Show>
        </Show>
      </div>
    </div>
  );
}
