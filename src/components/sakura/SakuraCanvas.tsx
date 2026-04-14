// ==========================================
// SakuraCanvas — 典藏版 · 秒速五厘米
// 新海诚风格：Godray + Bokeh + 逆光 + 空气透视
// ==========================================

import { onMount, onCleanup, createEffect } from "solid-js";
import { useSettingsStore } from "@/stores/settings";

/* ═══════════════ 类型 ═══════════════ */

interface TreeNode {
  depth: number;
  angle: number;
  length: number;
  thickness: number;
  swayOffset: number;
  swaySpeed: number;
  children: TreeNode[];
  hasBlossom: boolean;
  blossomRadius: number;
  blossomPhase: number;
  worldX1: number; worldY1: number;
  worldX2: number; worldY2: number;
}

interface Petal {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotSpeed: number;
  size: number; opacity: number;
  colorIdx: number;
  age: number; maxAge: number;
  driftPhase: number; driftFreq: number;
  flipAngle: number; flipSpeed: number;
  nxOff: number; nyOff: number;
  // 层深 0=近 1=中 2=远
  layer: number;
  grounded: boolean; groundY: number;
  groundRot: number; groundAlpha: number;
}

interface BokehCircle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  hue: number; // 0=pink 1=gold 2=white
  phase: number;
  freq: number;
  maxAge: number; age: number;
}

interface Godray {
  x: number; // 光柱底部x
  topX: number; // 光柱顶部x（偏移）
  width: number;
  opacity: number;
  phase: number;
  freq: number;
}

interface WindGust {
  start: number; dur: number; str: number;
}

/* ═══════════════ 常量 ═══════════════ */

const MAX_PETALS = 280;
const MAX_GROUNDED = 100;
const MAX_BOKEH = 18;
const GROUND_H = 50;
// 秒速5厘米 ≈ 每16ms帧 0.08px（在屏幕比例下约0.4-1.2px/帧）
const FALL_SPEED_BASE = 0.35;

// 新海诚色板 — 8种樱花色（暖粉→冷紫）
const PETAL_COLORS = [
  { r: 255, g: 200, b: 210 }, // 暖白粉
  { r: 255, g: 185, b: 200 }, // 樱粉
  { r: 255, g: 170, b: 195 }, // 淡玫
  { r: 255, g: 155, b: 185 }, // 玫粉
  { r: 255, g: 140, b: 178 }, // 深粉
  { r: 250, g: 195, b: 215 }, // 桃粉
  { r: 242, g: 210, b: 230 }, // 冷粉偏紫
  { r: 235, g: 200, b: 225 }, // 淡紫粉
];

/* ═══════════════ 噪声 ═══════════════ */

const P: number[] = [];
(function() {
  for (let i = 0; i < 256; i++) P[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [P[i], P[j]] = [P[j], P[i]];
  }
  for (let i = 0; i < 256; i++) P[256 + i] = P[i];
})();

const fd = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lr = (a: number, b: number, t: number) => a + t * (b - a);

function n2d(x: number, y: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fd(xf), v = fd(yf);
  const g = (h: number, dx: number, dy: number) =>
    (h & 3) === 0 ? dx + dy : (h & 3) === 1 ? -dx + dy : (h & 3) === 2 ? dx - dy : -dx - dy;
  return lr(
    lr(g(P[P[X]+Y],xf,yf), g(P[P[X+1]+Y],xf-1,yf), u),
    lr(g(P[P[X]+Y+1],xf,yf-1), g(P[P[X+1]+Y+1],xf-1,yf-1), u), v
  );
}

/* ═══════════════ 分形树 ═══════════════ */

function makeTree(sx: number, sy: number, len: number, maxD: number): TreeNode {
  function br(angle: number, length: number, depth: number, thick: number): TreeNode {
    const n: TreeNode = {
      depth, angle, length, thickness: thick,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.35 + Math.random() * 0.55,
      children: [],
      hasBlossom: depth >= maxD - 2,
      blossomRadius: depth >= maxD - 1 ? 7 + Math.random() * 10 : 4 + Math.random() * 6,
      blossomPhase: Math.random() * Math.PI * 2,
      worldX1: 0, worldY1: 0, worldX2: 0, worldY2: 0,
    };
    if (depth < maxD) {
      const cc = depth < 2 ? 2 : (Math.random() > 0.35 ? 2 : 3);
      const sp = depth < 2 ? 0.38 : 0.48 + Math.random() * 0.22;
      const sh = 0.58 + Math.random() * 0.14;
      for (let i = 0; i < cc; i++) {
        const t = cc === 1 ? 0 : (i / (cc - 1)) * 2 - 1;
        n.children.push(br(
          angle + t * sp + (Math.random() - 0.5) * 0.2,
          length * sh * (0.82 + Math.random() * 0.36),
          depth + 1, thick * 0.6
        ));
      }
    }
    return n;
  }
  const root = br(-Math.PI / 2, len, 0, len * 0.05);
  root.worldX1 = sx; root.worldY1 = sy;
  return root;
}

function getTips(n: TreeNode, out: TreeNode[] = []): TreeNode[] {
  if (!n.children.length) out.push(n);
  else n.children.forEach(c => getTips(c, out));
  return out;
}

/* ═══════════════ 工厂 ═══════════════ */

function mkPetal(x: number, y: number, wAngle: number, layer: number): Petal {
  const a = wAngle + (Math.random() - 0.5) * 0.8;
  const sp = 0.15 + Math.random() * 0.35;
  const sizeBase = layer === 0 ? 6 + Math.random() * 9 : layer === 1 ? 4 + Math.random() * 6 : 2.5 + Math.random() * 4;
  return {
    x, y,
    vx: Math.cos(a) * sp * 0.3,
    vy: FALL_SPEED_BASE + Math.random() * 0.25,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.035,
    size: sizeBase,
    opacity: layer === 2 ? 0.15 + Math.random() * 0.2 : 0.4 + Math.random() * 0.55,
    colorIdx: Math.floor(Math.random() * PETAL_COLORS.length),
    age: 0,
    maxAge: 600 + Math.random() * 800,
    driftPhase: Math.random() * Math.PI * 2,
    driftFreq: 0.006 + Math.random() * 0.012,
    flipAngle: Math.random() * Math.PI * 2,
    flipSpeed: 0.018 + Math.random() * 0.035,
    nxOff: Math.random() * 1000, nyOff: Math.random() * 1000,
    layer,
    grounded: false, groundY: 0, groundRot: 0, groundAlpha: 0,
  };
}

function mkBokeh(w: number, h: number): BokehCircle {
  return {
    x: Math.random() * w,
    y: Math.random() * h * 0.8,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.1 - 0.05,
    radius: 12 + Math.random() * 35,
    opacity: 0.03 + Math.random() * 0.08,
    hue: Math.floor(Math.random() * 3),
    phase: Math.random() * Math.PI * 2,
    freq: 0.005 + Math.random() * 0.01,
    maxAge: 800 + Math.random() * 1200, age: 0,
  };
}

/* ═══════════════ 主组件 ═══════════════ */

export default function SakuraCanvas() {
  const settingsStore = useSettingsStore();
  let canvasRef: HTMLCanvasElement | undefined;
  let raf: number;
  let petals: Petal[] = [];
  let grounded: Petal[] = [];
  let bokehs: BokehCircle[] = [];
  let godrays: Godray[] = [];
  let root: TreeNode | null = null;
  let tips: TreeNode[] = [];
  let gusts: WindGust[] = [];
  let t = 0;
  let spawnAcc = 0;
  let bokehAcc = 0;

  const on = () => settingsStore.settings().sakura_skin;

  onMount(() => {
    const cvs = canvasRef;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    let lw = 0, lh = 0;

    const rebuild = () => {
      const w = cvs!.width, h = cvs!.height;
      const tl = Math.min(h * 0.28, 260);
      root = makeTree(w * 0.83, h - GROUND_H, tl, 8);
      root.worldX1 = w * 0.83; root.worldY1 = h - GROUND_H;
      tips = getTips(root);
      // Godrays — 4-6束光柱从树冠区域射出
      godrays = [];
      const rayCount = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < rayCount; i++) {
        godrays.push({
          x: w * 0.75 + Math.random() * w * 0.2,
          topX: w * 0.6 + Math.random() * w * 0.3,
          width: 30 + Math.random() * 60,
          opacity: 0.02 + Math.random() * 0.03,
          phase: Math.random() * Math.PI * 2,
          freq: 0.2 + Math.random() * 0.3,
        });
      }
    };

    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      if (cvs.width !== lw || cvs.height !== lh) { lw = cvs.width; lh = cvs.height; rebuild(); }
    };
    resize();
    window.addEventListener("resize", resize);

    const dark = () => document.documentElement.getAttribute("data-theme") === "dark";

    /* ─── 风场 ─── */
    const wind = (tt: number) => {
      const base = n2d(tt * 0.2, 0.7) * 1.8;
      let gs = 0;
      for (const g of gusts) {
        const e = tt - g.start;
        if (e >= 0 && e < g.dur) gs += g.str * Math.sin((e / g.dur) * Math.PI);
      }
      return { str: base + gs, ang: -0.2 + n2d(0.4, tt * 0.12) * 0.3 };
    };
    const maybeGust = () => {
      if (gusts.length < 2 && Math.random() < 0.005)
        gusts.push({ start: t, dur: 100 + Math.random() * 250, str: 1.5 + Math.random() * 3 });
      gusts = gusts.filter(g => t - g.start < g.dur);
    };

    /* ─── 绘制树 ─── */
    const drawTree = (
      n: TreeNode, px: number, py: number, pAng: number,
      tt: number, ws: number, dk: boolean
    ) => {
      const sw = Math.sin(tt * n.swaySpeed + n.swayOffset) * ws * (1 / (n.depth + 1)) * 0.1;
      const absA = pAng + n.angle + sw;
      n.worldX1 = px; n.worldY1 = py;
      n.worldX2 = px + Math.cos(absA) * n.length;
      n.worldY2 = py + Math.sin(absA) * n.length;

      // 逆光下枝干偏暗（剪影感）
      ctx.beginPath();
      ctx.moveTo(n.worldX1, n.worldY1);
      ctx.lineTo(n.worldX2, n.worldY2);
      ctx.lineWidth = n.thickness;
      ctx.lineCap = "round";
      if (n.depth < 2) {
        ctx.strokeStyle = dk ? "rgba(45,30,25,0.95)" : "rgba(55,35,28,0.92)";
      } else if (n.depth < 5) {
        ctx.strokeStyle = dk ? "rgba(55,38,30,0.75)" : "rgba(65,45,35,0.78)";
      } else {
        ctx.strokeStyle = dk ? "rgba(65,45,35,0.5)" : "rgba(80,55,40,0.55)";
      }
      ctx.stroke();

      // 花簇 — 更大更蓬松，逆光下发亮
      if (n.hasBlossom && n.depth >= 3) {
        const pulse = Math.sin(tt * 0.6 + n.blossomPhase) * 0.1 + 1;
        const r = n.blossomRadius * pulse;
        const ba = dk ? 0.35 : 0.55;
        // 多层叠加的花簇
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + n.blossomPhase;
          const ox = Math.cos(a) * r * 0.4;
          const oy = Math.sin(a) * r * 0.4;
          const gr = ctx.createRadialGradient(
            n.worldX2 + ox, n.worldY2 + oy, 0,
            n.worldX2 + ox, n.worldY2 + oy, r
          );
          // 逆光透亮 — 中心更亮
          gr.addColorStop(0, `rgba(255,235,240,${ba * 0.9})`);
          gr.addColorStop(0.3, `rgba(255,210,220,${ba * 0.7})`);
          gr.addColorStop(0.7, `rgba(255,180,200,${ba * 0.4})`);
          gr.addColorStop(1, "rgba(255,170,195,0)");
          ctx.beginPath();
          ctx.arc(n.worldX2 + ox, n.worldY2 + oy, r, 0, Math.PI * 2);
          ctx.fillStyle = gr;
          ctx.fill();
        }
        // 花簇中心发光（逆光穿透感）
        const glowGr = ctx.createRadialGradient(
          n.worldX2, n.worldY2, 0,
          n.worldX2, n.worldY2, r * 0.6
        );
        const ga = dk ? 0.08 : 0.12;
        glowGr.addColorStop(0, `rgba(255,245,250,${ga})`);
        glowGr.addColorStop(1, "rgba(255,220,235,0)");
        ctx.beginPath();
        ctx.arc(n.worldX2, n.worldY2, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = glowGr;
        ctx.fill();
      }

      for (const c of n.children) drawTree(c, n.worldX2, n.worldY2, absA, tt, ws, dk);
    };

    /* ─── 绘制花瓣 ─── */
    const drawPetal = (p: Petal, dk: boolean) => {
      const c = PETAL_COLORS[p.colorIdx];
      const alpha = dk ? p.opacity * 0.55 : p.opacity;
      const flip = Math.cos(p.flipAngle) * 0.35 + 0.65;

      // 远景花瓣偏蓝（大气散射）
      let cr = c.r, cg = c.g, cb = c.b;
      if (p.layer === 2) { cr = Math.min(c.r + 10, 255); cg = Math.min(c.g + 5, 255); cb = Math.min(c.b + 25, 255); }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(flip, 1);
      ctx.globalAlpha = alpha;

      const s = p.size;
      // 心形花瓣（更接近真实樱花）
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.25, -s * 0.5, s * 0.42, -s * 0.25, s * 0.15, s * 0.15);
      ctx.bezierCurveTo(s * 0.05, s * 0.4, 0, s * 0.5, 0, s * 0.5);
      ctx.bezierCurveTo(0, s * 0.5, -s * 0.05, s * 0.4, -s * 0.15, s * 0.15);
      ctx.bezierCurveTo(-s * 0.42, -s * 0.25, -s * 0.25, -s * 0.5, 0, -s * 0.45);

      // 逆光透光感 — 花瓣中心偏白
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
      gr.addColorStop(0, `rgba(${Math.min(cr+40,255)},${Math.min(cg+40,255)},${Math.min(cb+30,255)},0.95)`);
      gr.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.8)`);
      gr.addColorStop(1, `rgba(${cr},${cg},${cb},0.2)`);
      ctx.fillStyle = gr;
      ctx.fill();

      // 逆光边缘高光
      ctx.shadowColor = `rgba(255,230,240,0.08)`;
      ctx.shadowBlur = 2;
      ctx.restore();
    };

    /* ═══════════════ 主循环 ═══════════════ */

    const frame = () => {
      if (!cvs) return;
      const w = cvs.width, h = cvs.height;
      const dk = dark();
      const enabled = on();
      ctx.clearRect(0, 0, w, h);
      t += 0.016;

      if (!enabled) { raf = requestAnimationFrame(frame); return; }

      maybeGust();
      const wd = wind(t);

      /* ─── 1. 天空渐变（新海诚逆光暖粉天空）─── */
      const skyGr = ctx.createLinearGradient(0, 0, 0, h);
      if (dk) {
        skyGr.addColorStop(0, "rgba(25,12,35,0.06)");
        skyGr.addColorStop(0.4, "rgba(35,18,40,0.04)");
        skyGr.addColorStop(1, "rgba(45,22,35,0.08)");
      } else {
        skyGr.addColorStop(0, "rgba(255,235,245,0.08)");
        skyGr.addColorStop(0.3, "rgba(255,225,240,0.06)");
        skyGr.addColorStop(0.6, "rgba(255,215,230,0.04)");
        skyGr.addColorStop(1, "rgba(255,200,220,0.07)");
      }
      ctx.fillStyle = skyGr;
      ctx.fillRect(0, 0, w, h);

      /* ─── 2. Godray 丁达尔光柱 ─── */
      if (!dk) {
        for (const ray of godrays) {
          const pulse = (Math.sin(t * ray.freq + ray.phase) * 0.3 + 0.7);
          const a = ray.opacity * pulse;
          const gr = ctx.createLinearGradient(ray.topX, 0, ray.x, h);
          gr.addColorStop(0, `rgba(255,245,235,0)`);
          gr.addColorStop(0.15, `rgba(255,240,230,${a * 0.3})`);
          gr.addColorStop(0.4, `rgba(255,230,220,${a})`);
          gr.addColorStop(0.7, `rgba(255,220,215,${a * 0.6})`);
          gr.addColorStop(1, `rgba(255,210,210,0)`);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ray.topX - ray.width * 0.3, 0);
          ctx.lineTo(ray.topX + ray.width * 0.3, 0);
          ctx.lineTo(ray.x + ray.width, h);
          ctx.lineTo(ray.x - ray.width, h);
          ctx.closePath();
          ctx.fillStyle = gr;
          ctx.fill();
          ctx.restore();
        }
      } else {
        // 深色模式 — 更微弱的光柱
        for (const ray of godrays) {
          const pulse = (Math.sin(t * ray.freq + ray.phase) * 0.3 + 0.7);
          const a = ray.opacity * pulse * 0.35;
          const gr = ctx.createLinearGradient(ray.topX, 0, ray.x, h);
          gr.addColorStop(0, `rgba(200,180,200,0)`);
          gr.addColorStop(0.3, `rgba(200,180,200,${a * 0.4})`);
          gr.addColorStop(0.6, `rgba(180,160,180,${a})`);
          gr.addColorStop(1, `rgba(160,140,160,0)`);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ray.topX - ray.width * 0.3, 0);
          ctx.lineTo(ray.topX + ray.width * 0.3, 0);
          ctx.lineTo(ray.x + ray.width, h);
          ctx.lineTo(ray.x - ray.width, h);
          ctx.closePath();
          ctx.fillStyle = gr;
          ctx.fill();
          ctx.restore();
        }
      }

      /* ─── 3. Bokeh 散景光斑 ─── */
      bokehAcc += 0.02;
      if (bokehs.length < MAX_BOKEH && bokehAcc >= 1) {
        bokehAcc -= 1;
        bokehs.push(mkBokeh(w, h));
      }
      const aliveBokeh: BokehCircle[] = [];
      for (const b of bokehs) {
        b.x += b.vx;
        b.y += b.vy + Math.sin(t * b.freq + b.phase) * 0.05;
        b.age++;
        // 淡入淡出
        let ba = b.opacity;
        if (b.age < 60) ba *= b.age / 60;
        if (b.age > b.maxAge - 120) ba *= (b.maxAge - b.age) / 120;
        ba *= (Math.sin(t * b.freq * 2 + b.phase) * 0.3 + 0.7); // 呼吸

        if (ba < 0.005 || b.age > b.maxAge) continue;

        const colors = dk
          ? [`rgba(200,160,190,${ba})`, `rgba(180,150,100,${ba})`, `rgba(180,180,200,${ba})`]
          : [`rgba(255,190,210,${ba})`, `rgba(255,220,150,${ba})`, `rgba(255,250,255,${ba})`];
        const color = colors[b.hue];

        const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        gr.addColorStop(0, color);
        gr.addColorStop(0.6, color.replace(/[\d.]+\)$/, `${ba * 0.4})`));
        gr.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        aliveBokeh.push(b);
      }
      bokehs = aliveBokeh;

      /* ─── 4. 树冠氛围光晕（逆光大范围光晕）─── */
      if (root) {
        const cx = root.worldX1;
        const cy = h * 0.3;
        const gr = Math.min(w, h) * 0.35;
        const glowGr = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        const ga = dk ? 0.025 : 0.05;
        glowGr.addColorStop(0, `rgba(255,200,220,${ga})`);
        glowGr.addColorStop(0.4, `rgba(255,190,210,${ga * 0.5})`);
        glowGr.addColorStop(1, "rgba(255,180,200,0)");
        ctx.fillStyle = glowGr;
        ctx.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);

        // 镜头眩光 — 逆光中心亮点
        const lensR = 60 + Math.sin(t * 0.15) * 15;
        const lensGr = ctx.createRadialGradient(cx - 20, cy + 30, 0, cx - 20, cy + 30, lensR);
        const la = dk ? 0.04 : 0.07;
        lensGr.addColorStop(0, `rgba(255,250,245,${la})`);
        lensGr.addColorStop(0.3, `rgba(255,240,235,${la * 0.5})`);
        lensGr.addColorStop(1, "rgba(255,230,225,0)");
        ctx.fillStyle = lensGr;
        ctx.beginPath();
        ctx.arc(cx - 20, cy + 30, lensR, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ─── 5. 绘制树 ─── */
      if (root) {
        drawTree(root, root.worldX1, root.worldY1, 0, t, wd.str, dk);
      }

      /* ─── 6. 产生花瓣 ─── */
      spawnAcc += 0.6 + wd.str * 0.35;
      while (spawnAcc >= 1 && petals.length < MAX_PETALS) {
        spawnAcc -= 1;
        if (tips.length > 0) {
          const tip = tips[Math.floor(Math.random() * tips.length)];
          const ox = (Math.random() - 0.5) * tip.blossomRadius * 2.5;
          const oy = (Math.random() - 0.5) * tip.blossomRadius * 2.5;
          petals.push(mkPetal(tip.worldX2 + ox, tip.worldY2 + oy, wd.ang, 0));
        }
      }
      // 中景花瓣
      if (petals.length < MAX_PETALS && Math.random() < 0.03) {
        petals.push(mkPetal(Math.random() * w, -10, wd.ang, 1));
      }
      // 远景花瓣（小、淡、偏蓝）
      if (petals.length < MAX_PETALS && Math.random() < 0.02) {
        petals.push(mkPetal(Math.random() * w, -10, wd.ang, 2));
      }

      /* ─── 7. 更新 & 绘制花瓣 ─── */
      const alive: Petal[] = [];
      for (const p of petals) {
        if (p.grounded) continue;

        const nx = n2d(p.nxOff + t * 0.35, p.nyOff) * 1.0;
        p.vx += Math.cos(wd.ang) * wd.str * 0.002 + nx * 0.006;
        p.vy += 0.004;
        p.vx *= 0.997; p.vy *= 0.998;
        p.driftPhase += p.driftFreq;
        p.vx += Math.sin(p.driftPhase) * 0.012;

        p.x += p.vx; p.y += p.vy;
        p.rotation += p.rotSpeed + wd.str * 0.003;
        p.flipAngle += p.flipSpeed;
        p.age++;
        if (p.age > p.maxAge * 0.75) p.opacity *= 0.997;

        const gl = h - GROUND_H + Math.random() * 8;
        if (p.y >= gl) {
          p.grounded = true;
          p.groundY = gl; p.groundRot = p.rotation;
          p.groundAlpha = p.opacity * 0.6;
          if (grounded.length < MAX_GROUNDED) grounded.push({ ...p });
          continue;
        }
        if (p.x < -150 || p.x > w + 150 || p.y > h + 50 || p.opacity < 0.03) continue;

        drawPetal(p, dk);
        alive.push(p);
      }
      petals = alive;

      /* ─── 8. 地面花瓣 ─── */
      for (let i = grounded.length - 1; i >= 0; i--) {
        const gp = grounded[i];
        gp.groundAlpha *= 0.9992;
        if (gp.groundAlpha < 0.02) { grounded.splice(i, 1); continue; }
        const c = PETAL_COLORS[gp.colorIdx];
        const a = dk ? gp.groundAlpha * 0.3 : gp.groundAlpha * 0.5;
        ctx.save();
        ctx.translate(gp.x, gp.groundY);
        ctx.rotate(gp.groundRot);
        ctx.scale(1, 0.25);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.ellipse(0, 0, gp.size * 0.28, gp.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${a})`;
        ctx.fill();
        ctx.restore();
      }

      /* ─── 9. 地面渐变 ─── */
      const gGr = ctx.createLinearGradient(0, h - GROUND_H - 20, 0, h);
      if (dk) {
        gGr.addColorStop(0, "rgba(35,15,22,0)");
        gGr.addColorStop(0.4, "rgba(42,18,28,0.2)");
        gGr.addColorStop(1, "rgba(50,22,32,0.35)");
      } else {
        gGr.addColorStop(0, "rgba(255,235,240,0)");
        gGr.addColorStop(0.4, "rgba(255,225,232,0.2)");
        gGr.addColorStop(1, "rgba(255,215,222,0.35)");
      }
      ctx.fillStyle = gGr;
      ctx.fillRect(0, h - GROUND_H - 20, w, GROUND_H + 20);

      /* ─── 10. 电影暗角 ─── */
      const vigR = Math.max(w, h) * 0.7;
      const vigGr = ctx.createRadialGradient(w / 2, h / 2, vigR * 0.4, w / 2, h / 2, vigR);
      const vigA = dk ? 0.12 : 0.06;
      vigGr.addColorStop(0, "rgba(0,0,0,0)");
      vigGr.addColorStop(1, `rgba(0,0,0,${vigA})`);
      ctx.fillStyle = vigGr;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    onCleanup(() => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); });
  });

  createEffect(() => { if (on()) { petals = []; grounded = []; bokehs = []; } });

  return (
    <canvas ref={canvasRef} class="fixed inset-0 z-0 pointer-events-none" style={{ "pointer-events": "none" }} />
  );
}
