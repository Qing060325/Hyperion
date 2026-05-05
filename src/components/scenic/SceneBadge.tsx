import { createMemo, Show } from "solid-js";
import { useSceneStore } from "@/stores/scene";
import { useSettingsStore } from "@/stores/settings";

/**
 * 场景信息浮标 — 显示当前地区/时段/主题色
 * 悬浮在页面右下角
 */
export default function SceneBadge() {
  const scene = useSceneStore();
  const settings = useSettingsStore();
  const isEnabled = createMemo(() => settings.settings().sakura_skin);

  const timeEmoji = createMemo(() => {
    switch (scene.timeOfDay()) {
      case "dawn": return "🌅";
      case "day": return "☀️";
      case "dusk": return "🌇";
      case "night": return "🌙";
    }
  });

  const timeLabel = createMemo(() => {
    switch (scene.timeOfDay()) {
      case "dawn": return "黎明";
      case "day": return "白天";
      case "dusk": return "黄昏";
      case "night": return "夜晚";
    }
  });

  return (
    <Show when={isEnabled()}>
      <div
        class="scene-badge"
        style={{
          "--scene-accent": scene.themeColor(),
        }}
      >
        <div class="scene-badge-row">
          <span class="scene-badge-flag">{scene.flag()}</span>
          <span class="scene-badge-region">{scene.regionLabel()}</span>
        </div>
        <div class="scene-badge-row scene-badge-time">
          <span>{timeEmoji()}</span>
          <span>{timeLabel()}</span>
        </div>
        {/* 主题色指示条 */}
        <div
          class="scene-badge-accent"
          style={{ background: scene.themeColor() }}
        />
      </div>
    </Show>
  );
}
