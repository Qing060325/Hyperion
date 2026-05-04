import { createMemo } from "solid-js";
import { useSettingsStore } from "@/stores/settings";

const LOCAL_IMAGE = "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=70";
const CDN_IMAGE = "https://cdn.jsdelivr.net/gh/mdn/web-components-examples/popup-info-box-web-component/image/cat.png";
const THIRD_PARTY_IMAGE = "https://picsum.photos/1920/1080";

export default function LandscapeBackground() {
  const settingsStore = useSettingsStore();

  const bgImage = createMemo(() => {
    const source = settingsStore.settings().landscape_image_source;
    if (source === "third_party") return THIRD_PARTY_IMAGE;
    if (source === "local_cdn") return CDN_IMAGE;
    return LOCAL_IMAGE;
  });

  const quality = createMemo(() => {
    const policy = settingsStore.settings().landscape_network_policy;
    return policy === "wifi_hd_cellular_degrade" ? "cover" : "cover";
  });

  return (
    <div
      aria-hidden="true"
      class="absolute inset-0 pointer-events-none transition-opacity duration-500"
      style={{
        opacity: settingsStore.settings().landscape_mode ? 0.22 : 0,
        "z-index": 0,
        background: `linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.12)), url(${bgImage()}) center / ${quality()} no-repeat`,
      }}
    />
  );
}
