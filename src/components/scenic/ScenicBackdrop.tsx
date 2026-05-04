import { createMemo, createSignal, onCleanup, onMount, Show, For } from "solid-js";
import { useSettingsStore } from "@/stores/settings";
import { useScenicModeStore } from "@/stores/scenicMode";

// Ken Burns animation duration for each image
const CYCLE_INTERVAL = 50000;
const CROSSFADE_DURATION = 1800;

// Region-based scenic video/image collections
// Each region has multiple high-quality landscape images
// that cycle with Ken Burns (slow zoom/pan) animations
const SCENES: Record<string, { images: string[]; label: string; flag: string }> = {
  JP: {
    label: "日本",
    flag: "🇯🇵",
    images: [
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  US: {
    label: "美国",
    flag: "🇺🇸",
    images: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  SG: {
    label: "新加坡",
    flag: "🇸🇬",
    images: [
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  HK: {
    label: "香港",
    flag: "🇭🇰",
    images: [
      "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1535556116002-6281ff3e9f36?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  DE: {
    label: "德国",
    flag: "🇩🇪",
    images: [
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  CH: {
    label: "瑞士",
    flag: "🇨🇭",
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  KR: {
    label: "韩国",
    flag: "🇰🇷",
    images: [
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  TW: {
    label: "台湾",
    flag: "🇹🇼",
    images: [
      "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  GB: {
    label: "英国",
    flag: "🇬🇧",
    images: [
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  DEFAULT: {
    label: "全球",
    flag: "🌍",
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
    ],
  },
};

// Map flag emojis to region codes
const FLAG_TO_CODE: Record<string, string> = {
  "🇯🇵": "JP", "🇺🇸": "US", "🇸🇬": "SG", "🇭🇰": "HK",
  "🇩🇪": "DE", "🇨🇭": "CH", "🇰🇷": "KR", "🇹🇼": "TW",
  "🇬🇧": "GB", "🇫🇷": "FR", "🇦🇺": "AU", "🇨🇦": "CA",
  "🇳🇱": "NL", "🇷🇺": "RU", "🇮🇳": "IN", "🇧🇷": "BR",
};

// Ken Burns animation variants
const KB_VARIANTS = [
  { from: "scale(1) translate(0, 0)", to: "scale(1.15) translate(-2%, -1%)" },
  { from: "scale(1.1) translate(-1%, 0)", to: "scale(1) translate(1%, -1%)" },
  { from: "scale(1) translate(0, -1%)", to: "scale(1.12) translate(-1%, 1%)" },
  { from: "scale(1.08) translate(1%, 1%)", to: "scale(1) translate(-1%, 0)" },
];

export default function ScenicBackdrop(props: { nodeName?: string }) {
  const settingsStore = useSettingsStore();
  const scenicStore = useScenicModeStore();
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [nextIndex, setNextIndex] = createSignal(1);
  const [showNext, setShowNext] = createSignal(false);
  const [kbVariant, setKbVariant] = createSignal(0);

  const regionCode = createMemo(() => {
    const nodeName = props.nodeName || "";
    const found = Object.entries(FLAG_TO_CODE).find(([flag]) => nodeName.includes(flag));
    return found?.[1] || "DEFAULT";
  });

  const regionInfo = createMemo(() => SCENES[regionCode()] || SCENES.DEFAULT);

  const images = createMemo(() => regionInfo().images);

  // Preload images
  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  onMount(() => {
    // Preload first few images
    images().slice(0, 3).forEach(preloadImage);

    const timer = setInterval(() => {
      const next = (currentIndex() + 1) % images().length;
      setNextIndex(next);
      setKbVariant((prev) => (prev + 1) % KB_VARIANTS.length);
      setShowNext(true);
      preloadImage(images()[(next + 1) % images().length]);

      setTimeout(() => {
        setCurrentIndex(next);
        setShowNext(false);
      }, CROSSFADE_DURATION);
    }, CYCLE_INTERVAL);

    onCleanup(() => clearInterval(timer));
  });

  // Reset index when region changes
  createMemo(() => {
    const _ = regionCode();
    setCurrentIndex(0);
    setNextIndex(1);
    setShowNext(false);
    setKbVariant(0);
  });

  const currentImage = createMemo(() => images()[currentIndex() % images().length]);
  const nextImage = createMemo(() => images()[nextIndex() % images().length]);
  const kb = createMemo(() => KB_VARIANTS[kbVariant()]);

  const isEnabled = createMemo(() => settingsStore.settings().sakura_skin);

  return (
    <div class="scenic-layer" classList={{ "scenic-enabled": isEnabled() }}>
      {/* Current image with Ken Burns animation */}
      <div
        class="scenic-image scenic-kb"
        style={{
          "background-image": `url(${currentImage()})`,
          "--kb-from": kb().from,
          "--kb-to": kb().to,
          opacity: showNext() ? "0" : "1",
        }}
      />

      {/* Next image (crossfade) */}
      <Show when={showNext()}>
        <div
          class="scenic-image scenic-kb"
          style={{
            "background-image": `url(${nextImage()})`,
            "--kb-from": KB_VARIANTS[(kbVariant() + 1) % KB_VARIANTS.length].from,
            "--kb-to": KB_VARIANTS[(kbVariant() + 1) % KB_VARIANTS.length].to,
            opacity: "1",
          }}
        />
      </Show>

      {/* Gradient overlay for readability */}
      <div class="scenic-overlay" />

      {/* Region indicator badge (shown when scenic mode is on) */}
      <Show when={isEnabled()}>
        <div class="scenic-region-badge">
          <span class="scenic-region-flag">{regionInfo().flag}</span>
          <span class="scenic-region-label">{regionInfo().label}</span>
        </div>
      </Show>
    </div>
  );
}
