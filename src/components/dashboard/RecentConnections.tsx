import { For, Show } from "solid-js";
import { formatBytes } from "@/utils/format";
import { AlertCircle } from "lucide-solid";

interface ConnectionItem {
  time: string;
  clientIp: string;
  node: string;
  protocol: string;
  upload: number;
  download: number;
  status: "connected" | "closed";
}

interface Props {
  connections: () => ConnectionItem[];
}

export default function RecentConnections(props: Props) {
  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>最新连接</span>
        <Show when={props.connections().length > 0}>
          <button class="text-xs cursor-pointer hover:underline" style={{ color: "#534BFF" }}>
            查看全部
          </button>
        </Show>
      </div>

      <Show
        when={props.connections().length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center py-12 px-6">
            <AlertCircle size={32} style={{ color: "#999" }} />
            <span style={{ "font-size": "14px", color: "#999", "margin-top": "12px" }}>暂无活跃连接</span>
          </div>
        }
      >
        <div class="overflow-x-auto px-4 pb-4">
          <table class="w-full">
            <thead>
              <tr>
                <For each={["时间", "客户端IP", "节点", "协议", "上传", "下载", "状态"]}>
                  {(h) => (
                    <th
                      class="text-left pb-3 font-normal"
                      style={{ "font-size": "12px", color: "#999", padding: "0 8px" }}
                    >
                      {h}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={props.connections()}>
                {(conn) => (
                  <tr class="hover:bg-[#F7F8FA] transition-colors" style={{ height: "48px" }}>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>{conn.time}</td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>{conn.clientIp}</td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>{conn.node}</td>
                    <td style={{ padding: "0 8px" }}>
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "#F5F5F5", color: "#666", "font-size": "11px" }}
                      >
                        {conn.protocol}
                      </span>
                    </td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>
                      {formatBytes(conn.upload)}
                    </td>
                    <td style={{ "font-size": "12px", color: "#666", padding: "0 8px" }}>
                      {formatBytes(conn.download)}
                    </td>
                    <td style={{ padding: "0 8px" }}>
                      <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full animate-subtle-pulse" style={{ background: "#00C48C" }} />
                        <span style={{ "font-size": "12px", color: "#00C48C" }}>活跃</span>
                      </span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
}
