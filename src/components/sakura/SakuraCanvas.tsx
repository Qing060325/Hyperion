// ==========================================
// SakuraCanvas — 樱花树实时渲染引擎 v2
// 分形树 + 风场 + 花瓣飘落 + 地面堆积
// ==========================================

import { onMount, onCleanup, createEffect } from "solid-js";
import { useSettingsStore } from "@/stores/settings";

/* ───────── 类型定义 ───────── */

interface TreeNode {
  depth: number;
  angle: number;          // 相对于父枝的角度
  length: number;
  thickness: number;
  swayOffset: number;
  swaySpeed: number;
  children: TreeNode[];
  hasBlossom: boolean;
  blossomRadius: number;
  blossomPhase: number;
  // 运行时：摇曳后的世界坐标（每帧更新）
  worldX1: number; worldY1: number;
  worldX2: number; worldY2: number;
}

interface Petal {
  x: number; y: number;
  vx: number; vy: number;
  rotation: number; rotationSpeed: number;
  size: number; opacity: number;
  colorIndex: number;
  age: number; maxAge: number;
  driftPhase: number; driftFreq: number;
  flipAngle: number; flipSpeed: number;
  noiseOffsetX: number; noiseOffsetY: number;
  grounded: boolean; groundY: number;
  groundRotation: number; groundOpacity: number;
}

interface WindGust {
  startTime: number; duration: number;
  strength: number;
}

/* ───────── 常量 ───────── */

const MAX_PETALS = 200;
const MAX_GROUNDED = 80;
const GROUND_OFFSET = 40;

const PETAL_PALETTES = [
  { r: 255, g: 192, b: 203 },
  { r: 255, g: 175, b: 190 },
  { r: 255, g: 150, b: 175 },
  { r: 255, g: 130, b: 165 },
  { r: 255, g: 105, b: 155 },
  { r: 255, g: 183, b: 197 },
  { r: 248, g: 200, b: 220 },
  { r: 255, g: 160, b: 185 },
];

/* ───────── 简易噪声 ───────── */

const PERM: number[] = [];
(function initPerm() {
  for (let i = 0; i < 256; i++) PERM[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [PERM[i], PERM[j]] = [PERM[j], PERM[i]];
  }
  for (let i = 0; i < 256; i++) PERM[256 + i] = PERM[i];
})();

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerpN(a: number, b: number, t: number) { return a + t * (b - a); }

function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = PERM[PERM[X] + Y];
  const ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y];
  const bb = PERM[PERM[X + 1] + Y + 1];
  const grad = (hash: number, dx: number, dy: number) => {
    const h = hash & 3;
    return (h === 0 ? dx + dy : h === 1 ? -dx + dy : h === 2 ? dx - dy : -dx - dy);
  };
  return lerpN(
    lerpN(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerpN(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

/* ───────── 分形树生成 ───────── */

function generateTree(startX: number, startY: number, trunkLength: number, maxDepth: number): TreeNode {
  function branch(angle: number, length: number, depth: number, thickness: number): TreeNode {
    const node: TreeNode = {
      depth, angle, length, thickness,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.4 + Math.random() * 0.6,
      children: [],
      hasBlossom: depth >= maxDepth - 2,
      blossomRadius: depth >= maxDepth - 1 ? 6 + Math.random() * 8 : 3 + Math.random() * 5,
      blossomPhase: Math.random() * Math.PI * 2,
      worldX1: 0, worldY1: 0,
      worldX2: 0, worldY2: 0,
    };

    if (depth < maxDepth) {
      const childCount = depth < 2 ? 2 : (Math.random() > 0.3 ? 2 : 3);
      const spread = depth < 2 ? 0.4 : 0.5 + Math.random() * 0.25;
      const shrink = 0.6 + Math.random() * 0.13;

      for (let i = 0; i < childCount; i++) {
        const t = childCount === 1 ? 0 : (i / (childCount - 1)) * 2 - 1;
        const childAngle = angle + t * spread + (Math.random() - 0.5) * 0.18;
        const childLength = length * shrink * (0.85 + Math.random() * 0.3);
        const childThickness = thickness * 0.62;
        node.children.push(branch(childAngle, childLength, depth + 1, childThickness));
      }
    }

    return node;
  }

  const root = branch(-Math.PI / 2, trunkLength, 0, trunkLength * 0.055);
  // 设置根节点的世界坐标起点
  root.worldX1 = startX;
  root.worldY1 = startY;
  return root;
}

/* ───────── 花瓣工厂 ───────── */

function createPetal(x: number, y: number, windAngle: number): Petal {
  const angle = windAngle + (Math.random() - 0.5) * 1.0;
  const speed = 0.2 + Math.random() * 0.6;
  return {
    x, y,
    vx: Math.cos(angle) * speed * 0.4,
    vy: 0.15 + Math.random() * 0.4,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.04,
    size: 5 + Math.random() * 8,
    opacity: 0.5 + Math.random() * 0.5,
    colorIndex: Math.floor(Math.random() * PETAL_PALETTES.length),
    age: 0,
    maxAge: 500 + Math.random() * 700,
    driftPhase: Math.random() * Math.PI * 2,
    driftFreq: 0.008 + Math.random() * 0.015,
    flipAngle: Math.random() * Math.PI * 2,
    flipSpeed: 0.02 + Math.random() * 0.04,
    noiseOffsetX: Math.random() * 1000,
    noiseOffsetY: Math.random() * 1000,
    grounded: false, groundY: 0,
    groundRotation: 0, groundOpacity: 0,
  };
}

/* ───────── 收集末端节点 ───────── */

function collectTips(node: TreeNode, tips: TreeNode[] = []): TreeNode[] {
  if (node.children.length === 0) {
    tips.push(node);
  } else {
    for (const child of node.children) {
      collectTips(child, tips);
    }
  }
  return tips;
}

/* ───────── 主组件 ───────── */

export default function SakuraCanvas() {
  const settingsStore = useSettingsStore();
  let canvasRef: HTMLCanvasElement | undefined;
  let animFrame: number;
  let petals: Petal[] = [];
  let groundedPetals: Petal[] = [];
  let treeRoot: TreeNode | null = null;
  let tips: TreeNode[] = [];
  let windGusts: WindGust[] = [];
  let time = 0;
  let spawnAccum = 0;

  const isEnabled = () => settingsStore.settings().sakura_skin;

  onMount(() => {
    const canvas = canvasRef;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastW = 0;
    let lastH = 0;

    const rebuildTree = () => {
      const w = canvas!.width;
      const h = canvas!.height;
      const trunkLen = Math.min(h * 0.24, 220);
      // 树位于右下区域
      const treeX = w * 0.82;
      const treeY = h - GROUND_OFFSET;
      treeRoot = generateTree(treeX, treeY, trunkLen, 7);
      tips = collectTips(treeRoot);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (canvas.width !== lastW || canvas.height !== lastH) {
        lastW = canvas.width;
        lastH = canvas.height;
        rebuildTree();
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

    // 风场
    const getWind = (t: number): { strength: number; angle: number } => {
      const base = noise2D(t * 0.25, 0.5) * 2;
      let gustStr = 0;
      for (const g of windGusts) {
        const elapsed = t - g.startTime;
        if (elapsed >= 0 && elapsed < g.duration) {
          gustStr += g.strength * Math.sin((elapsed / g.duration) * Math.PI);
        }
      }
      return {
        strength: base + gustStr,
        angle: -0.25 + noise2D(0.3, t * 0.15) * 0.35,
      };
    };

    const maybeSpawnGust = () => {
      if (windGusts.length < 2 && Math.random() < 0.004) {
        windGusts.push({
          startTime: time,
          duration: 120 + Math.random() * 250,
          strength: 1.5 + Math.random() * 3,
        });
      }
      windGusts = windGusts.filter(g => time - g.startTime < g.duration);
    };

    // 递归绘制树 + 更新世界坐标
    const drawNode = (
      node: TreeNode,
      parentEndX: number, parentEndY: number,
      parentAngle: number,
      t: number,
      windStr: number,
      dark: boolean
    ) => {
      // 本枝绝对角度 = 父枝角度 + 自身相对角度 + 风摇曳
      const swayAmount = windStr * (1 / (node.depth + 1)) * 0.12;
      const sway = Math.sin(t * node.swaySpeed + node.swayOffset) * swayAmount;
      const absAngle = parentAngle + node.angle + sway;

      // 起点 = 父枝终点
      node.worldX1 = parentEndX;
      node.worldY1 = parentEndY;

      // 终点
      node.worldX2 = node.worldX1 + Math.cos(absAngle) * node.length;
      node.worldY2 = node.worldY1 + Math.sin(absAngle) * node.length;

      // 绘制枝干
      ctx.beginPath();
      ctx.moveTo(node.worldX1, node.worldY1);
      ctx.lineTo(node.worldX2, node.worldY2);
      ctx.lineWidth = node.thickness;
      ctx.lineCap = "round";

      if (node.depth < 2) {
        ctx.strokeStyle = dark ? "rgba(75,55,45,0.92)" : "rgba(95,68,48,0.88)";
      } else if (node.depth < 4) {
        ctx.strokeStyle = dark ? "rgba(85,62,50,0.7)" : "rgba(105,78,58,0.75)";
      } else {
        ctx.strokeStyle = dark ? "rgba(95,70,55,0.5)" : "rgba(115,85,65,0.6)";
      }
      ctx.stroke();

      // 末端花簇
      if (node.hasBlossom && node.depth >= 3) {
        const pulse = Math.sin(t * 0.7 + node.blossomPhase) * 0.12 + 1;
        const r = node.blossomRadius * pulse;
        const alpha = dark ? 0.45 : 0.65;

        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + node.blossomPhase;
          const ox = Math.cos(a) * r * 0.35;
          const oy = Math.sin(a) * r * 0.35;
          const grad = ctx.createRadialGradient(
            node.worldX2 + ox, node.worldY2 + oy, 0,
            node.worldX2 + ox, node.worldY2 + oy, r * 0.75
          );
          grad.addColorStop(0, `rgba(255,205,215,${alpha})`);
          grad.addColorStop(0.5, `rgba(255,175,195,${alpha * 0.65})`);
          grad.addColorStop(1, `rgba(255,155,180,0)`);
          ctx.beginPath();
          ctx.arc(node.worldX2 + ox, node.worldY2 + oy, r * 0.75, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // 递归子枝
      for (const child of node.children) {
        drawNode(child, node.worldX2, node.worldY2, absAngle, t, windStr, dark);
      }
    };

    // 绘制单片花瓣
    const drawPetal = (p: Petal, dark: boolean) => {
      const c = PETAL_PALETTES[p.colorIndex];
      const alpha = dark ? p.opacity * 0.6 : p.opacity;
      const flipScale = Math.cos(p.flipAngle) * 0.4 + 0.6;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(flipScale, 1);
      ctx.globalAlpha = alpha;

      // 水滴形花瓣
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.5);
      ctx.bezierCurveTo(s * 0.35, -s * 0.5, s * 0.4, 0, 0, s * 0.5);
      ctx.bezierCurveTo(-s * 0.4, 0, -s * 0.35, -s * 0.5, 0, -s * 0.5);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.55);
      const cr = Math.min(c.r + 20, 255);
      const cg = Math.min(c.g + 20, 255);
      const cb = Math.min(c.b + 20, 255);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.95)`);
      grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.75)`);
      grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0.25)`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},0.12)`;
      ctx.shadowBlur = 3;
      ctx.restore();
    };

    // 主渲染循环
    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const dark = isDark();
      const enabled = isEnabled();

      ctx.clearRect(0, 0, w, h);

      time += 0.016;

      if (!enabled) {
        animFrame = requestAnimationFrame(draw);
        return;
      }

      // 风场
      maybeSpawnGust();
      const wind = getWind(time);

      // ─── 氛围背景光 ───
      // 底部樱花色渐变地面
      const groundGrad = ctx.createLinearGradient(0, h - GROUND_OFFSET - 30, 0, h);
      if (dark) {
        groundGrad.addColorStop(0, "rgba(40,18,28,0)");
        groundGrad.addColorStop(0.3, "rgba(50,22,32,0.25)");
        groundGrad.addColorStop(1, "rgba(60,28,38,0.45)");
      } else {
        groundGrad.addColorStop(0, "rgba(255,235,238,0)");
        groundGrad.addColorStop(0.3, "rgba(255,225,230,0.25)");
        groundGrad.addColorStop(1, "rgba(255,215,220,0.45)");
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h - GROUND_OFFSET - 30, w, GROUND_OFFSET + 30);

      // ─── 绘制树 ───
      if (treeRoot) {
        drawNode(treeRoot, treeRoot.worldX1, treeRoot.worldY1, 0, time, wind.strength, dark);
      }

      // ─── 产生花瓣 ───
      spawnAccum += 0.5 + wind.strength * 0.3;
      while (spawnAccum >= 1 && petals.length < MAX_PETALS) {
        spawnAccum -= 1;
        if (tips.length > 0) {
          const tip = tips[Math.floor(Math.random() * tips.length)];
          const ox = (Math.random() - 0.5) * tip.blossomRadius * 2;
          const oy = (Math.random() - 0.5) * tip.blossomRadius * 2;
          petals.push(createPetal(tip.worldX2 + ox, tip.worldY2 + oy, wind.angle));
        }
      }

      // 远处花瓣（营造景深）
      if (petals.length < MAX_PETALS && Math.random() < 0.015) {
        const p = createPetal(Math.random() * w, -10, wind.angle);
        p.size *= 0.5;
        p.opacity *= 0.35;
        petals.push(p);
      }

      // ─── 更新和绘制飘落花瓣 ───
      const alive: Petal[] = [];
      for (const p of petals) {
        if (p.grounded) continue;

        const nx = noise2D(p.noiseOffsetX + time * 0.4, p.noiseOffsetY) * 1.2;
        p.vx += Math.cos(wind.angle) * wind.strength * 0.0025 + nx * 0.008;
        p.vy += 0.006; // 重力
        p.vx *= 0.996;
        p.vy *= 0.998;
        p.driftPhase += p.driftFreq;
        p.vx += Math.sin(p.driftPhase) * 0.015;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed + wind.strength * 0.004;
        p.flipAngle += p.flipSpeed;
        p.age++;

        if (p.age > p.maxAge * 0.8) p.opacity *= 0.996;

        // 落地
        const groundLine = h - GROUND_OFFSET + Math.random() * 10;
        if (p.y >= groundLine) {
          p.grounded = true;
          p.groundY = groundLine;
          p.groundRotation = p.rotation;
          p.groundOpacity = p.opacity * 0.65;
          if (groundedPetals.length < MAX_GROUNDED) {
            groundedPetals.push({ ...p });
          }
          continue;
        }

        if (p.x < -120 || p.x > w + 120 || p.y > h + 50 || p.opacity < 0.04) continue;

        drawPetal(p, dark);
        alive.push(p);
      }
      petals = alive;

      // ─── 地面花瓣 ───
      for (let i = groundedPetals.length - 1; i >= 0; i--) {
        const gp = groundedPetals[i];
        gp.groundOpacity *= 0.9993;
        if (gp.groundOpacity < 0.025) { groundedPetals.splice(i, 1); continue; }
        const c = PETAL_PALETTES[gp.colorIndex];
        const a = dark ? gp.groundOpacity * 0.35 : gp.groundOpacity * 0.55;
        ctx.save();
        ctx.translate(gp.x, gp.groundY);
        ctx.rotate(gp.groundRotation);
        ctx.scale(1, 0.3);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.ellipse(0, 0, gp.size * 0.3, gp.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${a})`;
        ctx.fill();
        ctx.restore();
      }

      // ─── 树冠氛围光晕 ───
      if (treeRoot) {
        const cx = treeRoot.worldX1;
        const cy = h * 0.35;
        const glowR = Math.min(w, h) * 0.28;
        const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        const ga = dark ? 0.035 : 0.055;
        glowGrad.addColorStop(0, `rgba(255,185,205,${ga})`);
        glowGrad.addColorStop(1, "rgba(255,185,205,0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
      }

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);

    onCleanup(() => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    });
  });

  createEffect(() => {
    if (isEnabled()) {
      petals = [];
      groundedPetals = [];
    }
  });

  return (
    <canvas
      ref={canvasRef}
      class="fixed inset-0 z-0 pointer-events-none"
      style={{ "pointer-events": "none" }}
    />
  );
}
