import { onMount, onCleanup, createEffect } from "solid-js";
import { useSettingsStore } from "@/stores/settings";

interface Petal {
  x: number; y: number; rotation: number; rotationSpeed: number;
  size: number; opacity: number; driftPhase: number;
  driftAmplitude: number; driftSpeed: number; fallSpeed: number;
  wobble: number; colorIndex: number;
}

const PETAL_COUNT = 75;
const PETAL_COLORS = [
  { r: 255, g: 183, b: 197 },
  { r: 255, g: 150, b: 180 },
  { r: 255, g: 105, b: 180 },
  { r: 255, g: 192, b: 203 },
  { r: 255, g: 170, b: 190 },
];

function createPetal(cw: number, ch: number, startY?: number): Petal {
  return {
    x: Math.random() * cw,
    y: startY !== undefined ? startY : Math.random() * ch,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    size: 8 + Math.random() * 8,
    opacity: 0.3 + Math.random() * 0.6,
    driftPhase: Math.random() * Math.PI * 2,
    driftAmplitude: 20 + Math.random() * 30,
    driftSpeed: 0.005 + Math.random() * 0.01,
    fallSpeed: 0.5 + Math.random() * 1.5,
    wobble: Math.random() * Math.PI * 2,
    colorIndex: Math.floor(Math.random() * PETAL_COLORS.length),
  };
}

export default function SakuraCanvas() {
  const settingsStore = useSettingsStore();
  let canvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;
  let petals: Petal[] = [];

  const isEnabled = () => settingsStore.settings().sakura_skin;

  createEffect(() => {
    if (isEnabled() && canvasRef) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      petals = Array.from({ length: PETAL_COUNT }, () => createPetal(w, h));
    }
  });

  onMount(() => {
    const canvas = canvasRef;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!isEnabled()) {
        animFrame = requestAnimationFrame(draw);
        return;
      }

      const dark = isDark();

      for (const petal of petals) {
        petal.y += petal.fallSpeed;
        petal.x += Math.sin(petal.driftPhase) * petal.driftAmplitude * 0.01;
        petal.driftPhase += petal.driftSpeed;
        petal.rotation += petal.rotationSpeed;
        petal.wobble += 0.02;

        if (petal.y > h + 20) {
          petal.y = -20;
          petal.x = Math.random() * w;
          petal.driftPhase = Math.random() * Math.PI * 2;
        }
        if (petal.x < -50) petal.x = w + 50;
        if (petal.x > w + 50) petal.x = -50;

        const baseOpacity = dark ? petal.opacity * 0.6 : petal.opacity;
        const scaleX = Math.cos(petal.wobble) * 0.5 + 0.5;
        const c = PETAL_COLORS[petal.colorIndex];

        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rotation);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = baseOpacity;

        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size * 0.4, petal.size * 0.7, 0, 0, Math.PI * 2);

        const cr = Math.min(c.r + 20, 255);
        const cg = Math.min(c.g + 20, 255);
        const cb = Math.min(c.b + 20, 255);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petal.size * 0.7);
        gradient.addColorStop(0, "rgba(" + cr + "," + cg + "," + cb + ",0.9)");
        gradient.addColorStop(1, "rgba(" + c.r + "," + c.g + "," + c.b + ",0.4)");
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.shadowColor = "rgba(" + c.r + "," + c.g + "," + c.b + ",0.2)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.restore();
      }

      animFrame = requestAnimationFrame(draw);
    };

    petals = Array.from({ length: PETAL_COUNT }, () => createPetal(canvas.width, canvas.height));
    animFrame = requestAnimationFrame(draw);

    onCleanup(() => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    });
  });

  return (
    <canvas
      ref={canvasRef}
      class="fixed inset-0 z-0 pointer-events-none"
      style={{ "pointer-events": "none" }}
    />
  );
}
