import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useSettingsStore } from "@/stores/settings";

const SWITCH_INTERVAL = 45000;

const SCENES: Record<string, string[]> = {
  JP: [
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=1920&q=80",
  ],
  CH: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80"],
  SG: ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=80"],
  US: ["https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80"],
  HK: ["https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1920&q=80"],
  DE: ["https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1920&q=80"],
  DEFAULT: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80"],
};

const FLAG_TO_CODE: Record<string, string> = { "🇯🇵": "JP", "🇨🇭": "CH", "🇸🇬": "SG", "🇺🇸": "US", "🇭🇰": "HK", "🇩🇪": "DE" };

export default function ScenicBackdrop(props: { nodeName?: string }) {
  const settingsStore = useSettingsStore();
  const [imageIndex, setImageIndex] = createSignal(0);

  const regionCode = createMemo(() => {
    const nodeName = props.nodeName || "";
    const found = Object.entries(FLAG_TO_CODE).find(([flag]) => nodeName.includes(flag));
    return found?.[1] || "DEFAULT";
  });

  const images = createMemo(() => {
    const list = SCENES[regionCode()] || SCENES.DEFAULT;
    return list.length ? list : SCENES.DEFAULT;
  });

  onMount(() => {
    const timer = setInterval(() => setImageIndex((prev) => (prev + 1) % images().length), SWITCH_INTERVAL);
    onCleanup(() => clearInterval(timer));
  });

  const bgImage = createMemo(() => images()[imageIndex() % images().length]);

  return (
    <div class="scenic-layer" classList={{ "scenic-enabled": settingsStore.settings().sakura_skin }}>
      <div class="scenic-image" style={{ "background-image": `url(${bgImage()})` }} />
      <div class="scenic-overlay" />
    </div>
  );
}
