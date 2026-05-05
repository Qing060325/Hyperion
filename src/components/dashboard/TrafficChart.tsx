import { createEffect, onCleanup } from "solid-js";
import { formatSpeed } from "@/utils/format";

interface TrafficChartProps {
  data: () => { up: number; down: number }[];
}

export default function TrafficChart(props: TrafficChartProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;

  createEffect(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvasRef || !ctx) return;
      const w = (canvasRef.width = canvasRef.clientWidth * 2);
      const h = (canvasRef.height = canvasRef.clientHeight * 2);
      ctx.scale(2, 2);
      const cw = canvasRef.clientWidth;
      const ch = canvasRef.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      const history = props.data();
      if (history.length < 2) {
        animFrame = requestAnimationFrame(draw);
        return;
      }

      const maxVal = Math.max(1, ...history.map((h) => Math.max(h.up, h.down)));
      const points = 120;

      // Grid lines
      ctx.strokeStyle = "#F0F0F0";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Y-axis labels
      ctx.fillStyle = "#999999";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        const val = ((4 - i) / 4) * maxVal;
        ctx.fillText(formatSpeed(val), 36, y + 4);
      }

      const drawLine = (key: "up" | "down", color: string, fillColor: string) => {
        ctx!.beginPath();
        ctx!.moveTo(40, ch);
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = 40 + ((cw - 40) / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          ctx!.lineTo(x, y);
        }
        ctx!.lineTo(cw, ch);
        ctx!.lineTo(40, ch);
        ctx!.closePath();
        const gradient = ctx!.createLinearGradient(0, 0, 0, ch);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, "transparent");
        ctx!.fillStyle = gradient;
        ctx!.fill();

        ctx!.beginPath();
        for (let i = 0; i < points; i++) {
          const idx = Math.max(0, history.length - points + i);
          const val = history[idx]?.[key] || 0;
          const x = 40 + ((cw - 40) / (points - 1)) * i;
          const y = ch - (val / maxVal) * ch * 0.85;
          if (i === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = color;
        ctx!.lineWidth = 2;
        ctx!.stroke();
      };

      drawLine("down", "#5B8CFF", "rgba(91, 140, 255, 0.10)");
      drawLine("up", "#FF6B6B", "rgba(255, 107, 107, 0.10)");

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    onCleanup(() => cancelAnimationFrame(animFrame));
  });

  return (
    <div class="card bg-base-100 animate-card-spring">
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>流量趋势</span>
        <div class="flex items-center gap-4">
          <select
            class="bg-[#F5F5F5] text-xs px-3 py-1.5 rounded-lg border-none outline-none"
            style={{ color: "#666" }}
          >
            <option>按小时</option>
            <option>按天</option>
            <option>按周</option>
          </select>
          <div class="flex items-center gap-4 text-xs" style={{ color: "#666" }}>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-0.5 rounded-full" style={{ background: "#5B8CFF" }} />
              下载 (B/s)
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-0.5 rounded-full" style={{ background: "#FF6B6B" }} />
              上传 (B/s)
            </span>
          </div>
        </div>
      </div>
      <div class="px-6 pb-6" style={{ height: "260px" }}>
        <canvas ref={canvasRef} class="w-full h-full" />
      </div>
    </div>
  );
}
