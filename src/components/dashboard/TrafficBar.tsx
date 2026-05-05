import { For } from "solid-js";

interface TrafficBarProps {
  data: () => { hour: string; up: number; down: number }[];
}

export default function TrafficBar(props: TrafficBarProps) {
  const data = props.data;
  const maxVal = () => Math.max(1, ...data().map((d) => Math.max(d.up, d.down)));
  const barH = 130;

  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>流量统计</span>
        <div class="flex items-center gap-4 text-xs" style={{ color: "#666" }}>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm" style={{ background: "#FF6B6B" }} />
            上传流量
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm" style={{ background: "#5B8CFF" }} />
            下载流量
          </span>
        </div>
      </div>
      <div class="px-6 pb-6">
        <div class="flex flex-col">
          <div class="flex items-end gap-1.5" style={{ height: `${barH + 20}px` }}>
            <div class="flex flex-col justify-between h-full pr-2 text-right" style={{ width: "36px" }}>
              <For each={["50MB/s", "40MB/s", "30MB/s", "20MB/s", "10MB/s", "0"]}>
                {(label) => <span class="text-[10px] text-[#999] leading-none">{label}</span>}
              </For>
            </div>
            <For each={data()}>
              {(d) => {
                const downH = (d.down / maxVal()) * barH;
                const upH = (d.up / maxVal()) * barH;
                return (
                  <div class="flex-1 flex flex-col items-center gap-0.5 group">
                    <div class="flex gap-0.5 items-end" style={{ height: `${barH}px` }}>
                      <div
                        class="w-3 rounded-t-sm transition-opacity group-hover:opacity-80"
                        style={{ height: `${downH}px`, "background-color": "#5B8CFF" }}
                      />
                      <div
                        class="w-3 rounded-t-sm transition-opacity group-hover:opacity-80"
                        style={{ height: `${upH}px`, "background-color": "#FF6B6B" }}
                      />
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
          <div class="flex gap-1.5 ml-[36px] mt-1">
            <For each={data()}>
              {(d) => (
                <div class="flex-1 text-center">
                  <span class="text-[9px] text-[#999]">{d.hour.slice(0, 2)}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
