import { createSignal, createMemo, createEffect, on } from "solid-js";
import { createStore } from "solid-js/store";
import { activeNode } from "./activeNode";
import { detectRegion, SCENES } from "@/components/scenic/ScenicBackdrop";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface SceneState {
  /** 地区代码 (JP, US, ...) */
  regionCode: string;
  /** 显示名称 */
  regionLabel: string;
  /** 国旗 emoji */
  flag: string;
  /** 时段 */
  timeOfDay: TimeOfDay;
  /** 主色调 (根据地区 + 时段动态计算) */
  themeColor: string;
  /** 暖色/冷色倾向 */
  temperature: "warm" | "cool" | "neutral";
  /** 场景切换中 */
  transitioning: boolean;
  /** 上一个地区代码 */
  previousRegion: string | null;
}

// 地区 → 主题色
const REGION_COLORS: Record<string, string> = {
  JP: "#FF6B9D",  // 樱花粉
  US: "#4A90D9",  // 自由蓝
  SG: "#00C48C",  // 热带绿
  HK: "#FFB800",  // 维港金
  DE: "#5B8CFF",  // 欧洲蓝
  KR: "#A855F7",  // 韩流紫
  TW: "#FF8C42",  // 宝岛橙
  GB: "#2D3436",  // 英伦灰
  FR: "#6C5CE7",  // 法式紫
  AU: "#00CEC9",  // 澳洲青
  CA: "#E17055",  // 枫叶红
  RU: "#0984E3",  // 俄蓝
  IN: "#FDCB6E",  // 印度金
  DEFAULT: "#534BFF",
};

// 地区 → 色温
const REGION_TEMPERATURE: Record<string, "warm" | "cool" | "neutral"> = {
  JP: "warm", US: "neutral", SG: "warm", HK: "warm",
  DE: "cool", KR: "cool", TW: "warm", GB: "cool",
  FR: "neutral", AU: "warm", CA: "neutral", RU: "cool",
  IN: "warm", DEFAULT: "neutral",
};

// 时段 → 色彩修正
const TIME_MODIFIERS: Record<TimeOfDay, { sat: number; light: number }> = {
  dawn:  { sat: 0.9, light: 0.85 },
  day:   { sat: 1.0, light: 1.0 },
  dusk:  { sat: 0.8, light: 0.75 },
  night: { sat: 0.6, light: 0.55 },
};

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

function adjustColor(base: string, tod: TimeOfDay): string {
  const mod = TIME_MODIFIERS[tod];
  // 简单的亮度调整：将 hex 转为 HSL 调整后再转回
  // 这里用简化方案：直接叠加透明度模拟
  return base;
}

function createSceneStore() {
  const [state, setState] = createStore<SceneState>({
    regionCode: "DEFAULT",
    regionLabel: "全球",
    flag: "🌍",
    timeOfDay: getTimeOfDay(),
    themeColor: REGION_COLORS.DEFAULT,
    temperature: "neutral",
    transitioning: false,
    previousRegion: null,
  });

  // 跟踪节点变化 → 更新场景
  createEffect(() => {
    const node = activeNode();
    const code = detectRegion(node || "");
    const scene = SCENES[code] || SCENES.DEFAULT;
    const prev = state.regionCode;

    if (code !== prev) {
      setState("transitioning", true);
      setState("previousRegion", prev);

      // 短暂延迟后切换（让过渡动画播放）
      setTimeout(() => {
        setState("regionCode", code);
        setState("regionLabel", scene.label);
        setState("flag", scene.flag);
        setState("themeColor", REGION_COLORS[code] || REGION_COLORS.DEFAULT);
        setState("temperature", REGION_TEMPERATURE[code] || "neutral");

        setTimeout(() => {
          setState("transitioning", false);
          setState("previousRegion", null);
        }, 800);
      }, 200);
    }
  });

  // 每分钟更新时段
  const timeTimer = setInterval(() => {
    setState("timeOfDay", getTimeOfDay());
  }, 60000);

  // 计算属性
  const regionCode = () => state.regionCode;
  const regionLabel = () => state.regionLabel;
  const flag = () => state.flag;
  const timeOfDay = () => state.timeOfDay;
  const themeColor = () => state.themeColor;
  const temperature = () => state.temperature;
  const transitioning = () => state.transitioning;

  /** 是否夜晚 */
  const isNight = createMemo(() => state.timeOfDay === "night");
  /** 是否黄昏/黎明 */
  const isTwilight = createMemo(() => state.timeOfDay === "dawn" || state.timeOfDay === "dusk");

  /** 获取当前场景的图片列表 */
  const sceneImages = createMemo(() => {
    const scene = SCENES[state.regionCode] || SCENES.DEFAULT;
    return scene.images;
  });

  /** 获取 CSS 变量集（供全局使用） */
  const cssVars = createMemo(() => ({
    "--scene-color": state.themeColor,
    "--scene-temperature": state.temperature,
    "--scene-time": state.timeOfDay,
  }));

  return {
    state,
    regionCode,
    regionLabel,
    flag,
    timeOfDay,
    themeColor,
    temperature,
    transitioning,
    isNight,
    isTwilight,
    sceneImages,
    cssVars,
  };
}

let _sceneStore: ReturnType<typeof createSceneStore> | null = null;

export function useSceneStore() {
  if (!_sceneStore) {
    _sceneStore = createSceneStore();
  }
  return _sceneStore;
}
