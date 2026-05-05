import { For } from "solid-js";
import { formatBytes } from "@/utils/format";

interface ProtocolStat {
  name: string;
  percentage: number;
  traffic: number;
  color: string;
}

interface Props {
  data: () => ProtocolStat[];
}

export default function ProtocolPie(props: Props) {
  const data = props.data;
  const total = () => data().reduce((s, p) => s + p.traffic, 0);

  const arcs = () => {
    const d = data();
    const t = total();
    let acc = 0;
    const r = 55;
    const cx = 65;
    const cy = 65;

    return d.map((p) => {
      const startAngle = (acc / t) * 2 * Math.PI - Math.PI / 2;
      acc += p.traffic;
      const endAngle = (acc / t) * 2 * Math.PI - Math.PI / 2;
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...p, path };
    });
  };

  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>协议使用情况</span>
      </div>
      <div class="px-6 pb-6">
        <div class="flex items-start gap-6">
          <svg width="130" height="130" viewBox="0 0 130 130" class="flex-shrink-0">
            <For each={arcs()}>
              {(arc) => <path d={arc.path} fill={arc.color} stroke="white" stroke-width="2" />}
            </For>
            <circle cx={65} cy={65} r="30" fill="white" />
            <text x={65} y={61} text-anchor="middle" font-size="12" font-weight="600" fill="#333333">
              {formatBytes(total())}
            </text>
            <text x={65} y={75} text-anchor="middle" font-size="9" fill="#999999">
              总流量
            </text>
          </svg>
          <div class="flex flex-col gap-2.5 flex-1 pt-1">
            <For each={data()}>
              {(p) => (
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ "background-color": p.color }} />
                  <span class="text-xs text-[#666] flex-1">{p.name}</span>
                  <span class="text-xs font-medium text-[#333]">{p.percentage}%</span>
                  <span class="text-xs text-[#999] w-16 text-right">{formatBytes(p.traffic)}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
