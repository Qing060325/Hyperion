import { For, Show } from "solid-js";
import { TrendingUp } from "lucide-solid";
import { formatBytes } from "@/utils/format";

interface NodeInfo {
  name: string;
  traffic?: number;
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
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>在线节点 TOP5</span>
      </div>

      <div class="px-4 pb-4">
        <Show
          when={props.nodes().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-12">
              <TrendingUp size={32} style={{ color: "#999" }} />
              <span style={{ "font-size": "14px", color: "#999", "margin-top": "12px" }}>暂无在线节点</span>
            </div>
          }
        >
          <div class="flex items-center gap-3 px-3 pb-2" style={{ "border-bottom": "1px solid #F0F0F0" }}>
            <span style={{ "font-size": "12px", color: "#999", width: "40px" }}>排行</span>
            <span style={{ "font-size": "12px", color: "#999", flex: 1 }}>节点</span>
            <span style={{ "font-size": "12px", color: "#999", width: "80px", "text-align": "right" }}>状态</span>
          </div>
          <For each={props.nodes()}>
            {(node, i) => (
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
                      style={{ width: "100%", "background-color": colors[i()] || "#999", opacity: 0.5 }}
                    />
                  </div>
                </div>
                <span
                  style={{
                    "font-size": "12px",
                    color: "#00C48C",
                    width: "80px",
                    "text-align": "right",
                  }}
                >
                  在线
                </span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
