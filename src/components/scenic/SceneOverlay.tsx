import { createMemo, Show } from "solid-js";
import { useSceneStore } from "@/stores/scene";
import { useSettingsStore } from "@/stores/settings";

/**
 * 场景遮罩层 — 叠加在风景之上、内容之下
 * 根据时段自动调整透明度和色调
 */
export default function SceneOverlay() {
  const scene = useSceneStore();
  const settings = useSettingsStore();

  const isEnabled = createMemo(() => settings.settings().sakura_skin);

  /** 根据时段计算遮罩渐变 */
  const overlayStyle = createMemo(() => {
    const tod = scene.timeOfDay();
    const opacity = settings.settings().scenic_opacity / 100;

    // 基础遮罩：确保文字可读
    const base = `rgba(255,255,255,${0.4 + (1 - opacity) * 0.4})`;

    // 时段修正
    let topAlpha: number;
    let bottomAlpha: number;

    switch (tod) {
      case "night":
        topAlpha = 0.3;
        bottomAlpha = 0.7;
        break;
      case "dawn":
      case "dusk":
        topAlpha = 0.4;
        bottomAlpha = 0.75;
        break;
      default: // day
        topAlpha = 0.5;
        bottomAlpha = 0.85;
    }

    // 根据用户透明度设置缩放
    topAlpha *= opacity;
    bottomAlpha *= opacity;

    return {
      background: `linear-gradient(
        to bottom,
        rgba(255,255,255,${topAlpha}) 0%,
        rgba(255,255,255,${(topAlpha + bottomAlpha) / 2}) 40%,
        rgba(255,255,255,${bottomAlpha}) 100%
      )`,
      "backdrop-filter": `blur(${settings.settings().scenic_blur}px)`,
      "-webkit-backdrop-filter": `blur(${settings.settings().scenic_blur}px)`,
    };
  });

  /** 夜间模式额外叠加暗色滤镜 */
  const nightOverlayStyle = createMemo(() => {
    if (scene.timeOfDay() !== "night") return {};
    return {
      background: "rgba(10, 10, 30, 0.15)",
    };
  });

  /** 场景切换过渡动画 */
  const transitionClass = createMemo(() =>
    scene.transitioning() ? "scene-overlay-transitioning" : ""
  );

  return (
    <Show when={isEnabled()}>
      {/* 主遮罩：保证可读性 */}
      <div
        class={`scene-overlay ${transitionClass()}`}
        style={overlayStyle()}
      />
      {/* 夜间暗色滤镜 */}
      <Show when={scene.timeOfDay() === "night"}>
        <div class="scene-night-filter" style={nightOverlayStyle()} />
      </Show>
    </Show>
  );
}
