import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { useSettingsStore } from "@/stores/settings";
import { activeNode } from "@/stores/activeNode";

const CYCLE_INTERVAL = 50000;
const CROSSFADE_DURATION = 1800;

// Region-based scenic images — exact high-quality landscapes
export const SCENES: Record<string, { images: string[]; label: string; flag: string }> = {
  JP: {
    label: "日本·东京",
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
    ],
  },
  SG: {
    label: "新加坡",
    flag: "🇸🇬",
    images: [
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  HK: {
    label: "香港",
    flag: "🇭🇰",
    images: [
      "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  DE: {
    label: "德国",
    flag: "🇩🇪",
    images: [
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1920&q=80",
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
      "https://images.unsplash.com/photo-1550697851-920b181b6cf6?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  GB: {
    label: "英国",
    flag: "🇬🇧",
    images: [
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1489493585363-d69421e0edd3?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  FR: {
    label: "法国",
    flag: "🇫🇷",
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  AU: {
    label: "澳大利亚",
    flag: "🇦🇺",
    images: [
      "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  CA: {
    label: "加拿大",
    flag: "🇨🇦",
    images: [
      "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  RU: {
    label: "俄罗斯",
    flag: "🇷🇺",
    images: [
      "https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1547448415-e9f5b28e570d?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  IN: {
    label: "印度",
    flag: "🇮🇳",
    images: [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
    ],
  },
  DEFAULT: {
    label: "全球",
    flag: "🌍",
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80",
    ],
  },
};

// 国旗 emoji → 地区代码
const FLAG_TO_CODE: Record<string, string> = {
  "🇯🇵": "JP", "🇺🇸": "US", "🇸🇬": "SG", "🇭🇰": "HK",
  "🇩🇪": "DE", "🇨🇭": "CH", "🇰🇷": "KR", "🇹🇼": "TW",
  "🇬🇧": "GB", "🇫🇷": "FR", "🇦🇺": "AU", "🇨🇦": "CA",
  "🇷🇺": "RU", "🇮🇳": "IN", "🇧🇷": "BR", "🇮🇹": "IT",
  "🇳🇱": "NL", "🇪🇸": "ES", "🇸🇪": "SE", "🇳🇴": "NO",
  "🇫🇮": "FI", "🇵🇱": "PL", "🇺🇦": "UA", "🇹🇭": "TH",
  "🇻🇳": "VN", "🇲🇾": "MY", "🇵🇭": "PH", "🇮🇩": "ID",
  "🇦🇪": "AE", "🇹🇷": "TR", "🇲🇽": "MX", "🇦🇷": "AR",
  "🇨🇱": "CL", "🇨🇴": "CO", "🇿🇦": "ZA", "🇪🇬": "EG",
};

// 中文名称关键词 → 地区代码（支持模糊匹配）
const CN_KEYWORD_TO_CODE: [RegExp, string][] = [
  [/日本|东京|大阪|横滨|京都|名古屋/, "JP"],
  [/美国|洛杉矶|硅谷|纽约|西雅图|达拉斯|芝加哥|华盛顿/, "US"],
  [/新加坡|狮城/, "SG"],
  [/香港|港/, "HK"],
  [/台湾|台北|台中|高雄/, "TW"],
  [/韩国|首尔|韩/, "KR"],
  [/德国|法兰克福|柏林/, "DE"],
  [/英国|伦敦|英/, "GB"],
  [/法国|巴黎/, "FR"],
  [/澳大利亚|澳洲|悉尼|墨尔本/, "AU"],
  [/加拿大|多伦多|温哥华/, "CA"],
  [/俄罗斯|莫斯科/, "RU"],
  [/印度|孟买|班加罗尔/, "IN"],
  [/荷兰|阿姆斯特丹/, "NL"],
  [/巴西|圣保罗/, "BR"],
  [/土耳其|伊斯坦布尔/, "TR"],
  [/泰国|曼谷/, "TH"],
  [/越南|胡志明/, "VN"],
  [/马来西亚|吉隆坡/, "MY"],
  [/菲律宾|马尼拉/, "PH"],
  [/印度尼西亚|雅加达/, "ID"],
  [/阿联酋|迪拜/, "AE"],
  [/阿根廷|布宜诺/, "AR"],
  [/墨西哥/, "MX"],
  [/南非|开普敦/, "ZA"],
];

// 英文关键词 → 地区代码
const EN_KEYWORD_TO_CODE: [RegExp, string][] = [
  [/japan|tokyo|osaka|yokohama|kyoto/i, "JP"],
  [/united\s*states|usa?|los\s*angeles|silicon|new\s*york|seattle|dallas|chicago|washington/i, "US"],
  [/singapore/i, "SG"],
  [/hong\s*kong|hongkong/i, "HK"],
  [/taiwan|taipei/i, "TW"],
  [/korea|seoul/i, "KR"],
  [/germany|frankfurt|berlin/i, "DE"],
  [/united\s*kingdom|britain|london/i, "GB"],
  [/france|paris/i, "FR"],
  [/australia|sydney|melbourne/i, "AU"],
  [/canada|toronto|vancouver/i, "CA"],
  [/russia|moscow/i, "RU"],
  [/india|mumbai|bangalore/i, "IN"],
  [/netherlands|amsterdam/i, "NL"],
  [/brazil|são\s*paulo/i, "BR"],
  [/turkey|istanbul/i, "TR"],
  [/thailand|bangkok/i, "TH"],
  [/vietnam/i, "VN"],
  [/malaysia|kuala/i, "MY"],
  [/philippines|manila/i, "PH"],
  [/indonesia|jakarta/i, "ID"],
  [/uae|dubai/i, "AE"],
];

/**
 * 从节点名称识别地区代码
 * 优先级：国旗 emoji > 中文名称 > 英文缩写/名称 > DEFAULT
 */
export function detectRegion(nodeName: string): string {
  if (!nodeName) return "DEFAULT";

  // 1. 优先匹配国旗 emoji
  for (const [flag, code] of Object.entries(FLAG_TO_CODE)) {
    if (nodeName.includes(flag)) return code;
  }

  // 2. 匹配中文名称关键词
  for (const [regex, code] of CN_KEYWORD_TO_CODE) {
    if (regex.test(nodeName)) return code;
  }

  // 3. 匹配英文关键词
  for (const [regex, code] of EN_KEYWORD_TO_CODE) {
    if (regex.test(nodeName)) return code;
  }

  return "DEFAULT";
}

// Ken Burns animation variants
const KB_VARIANTS = [
  { from: "scale(1) translate(0, 0)", to: "scale(1.12) translate(-2%, -1%)" },
  { from: "scale(1.08) translate(-1%, 0)", to: "scale(1) translate(1%, -1%)" },
  { from: "scale(1) translate(0, -1%)", to: "scale(1.1) translate(-1%, 1%)" },
  { from: "scale(1.06) translate(1%, 1%)", to: "scale(1) translate(-1%, 0)" },
];

export default function ScenicBackdrop() {
  const settingsStore = useSettingsStore();
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [nextIndex, setNextIndex] = createSignal(1);
  const [showNext, setShowNext] = createSignal(false);
  const [kbVariant, setKbVariant] = createSignal(0);

  const regionCode = createMemo(() => detectRegion(activeNode()));

  const regionInfo = createMemo(() => SCENES[regionCode()] || SCENES.DEFAULT);
  const images = createMemo(() => regionInfo().images);

  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  onMount(() => {
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

  // Reset on region change
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
  const opacity = createMemo(() => settingsStore.settings().scenic_opacity / 100);
  const blur = createMemo(() => settingsStore.settings().scenic_blur);

  return (
    <div
      class="scenic-layer"
      classList={{ "scenic-enabled": isEnabled() }}
      style={{
        "--scenic-opacity": opacity(),
        "--scenic-blur": `${blur()}px`,
      }}
    >
      <div
        class="scenic-image scenic-kb"
        style={{
          "background-image": `url(${currentImage()})`,
          "--kb-from": kb().from,
          "--kb-to": kb().to,
          opacity: showNext() ? "0" : "1",
        }}
      />
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
      <div class="scenic-overlay" />

      {/* Region badge */}
      <Show when={isEnabled()}>
        <div class="scenic-region-badge">
          <span class="scenic-region-flag">{regionInfo().flag}</span>
          <span class="scenic-region-label">{regionInfo().label}</span>
        </div>
      </Show>
    </div>
  );
}
