import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { useSettingsStore } from "@/stores/settings";

const MAX_RESIDENT_CACHE = 3;
const FADE_DURATION_MS = 320;

const LOCAL_IMAGES = ["/landscape/scene-1.svg", "/landscape/scene-2.svg", "/landscape/scene-3.svg"];
const REMOTE_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=80",
];

export default function LandscapeBackground() {
  const settingsStore = useSettingsStore();
  const [currentSrc, setCurrentSrc] = createSignal<string>(LOCAL_IMAGES[0]);
  const [nextSrc, setNextSrc] = createSignal<string | null>(null);
  const [overlayVisible, setOverlayVisible] = createSignal(true);
  const [isTransitioning, setIsTransitioning] = createSignal(false);
  const cache = new Map<string, HTMLImageElement>();

  const candidates = createMemo(() =>
    settingsStore.settings().landscape_local_only ? LOCAL_IMAGES : [...LOCAL_IMAGES, ...REMOTE_IMAGES],
  );

  const rememberDecoded = (src: string, img: HTMLImageElement) => {
    cache.set(src, img);
    while (cache.size > MAX_RESIDENT_CACHE) {
      const oldest = cache.keys().next().value;
      if (!oldest || oldest === currentSrc()) break;
      cache.delete(oldest);
    }
  };

  const decodeImage = async (src: string) => {
    if (cache.has(src)) return cache.get(src)!;
    const img = new Image();
    img.src = src;
    await img.decode();
    rememberDecoded(src, img);
    return img;
  };

  const switchTo = async (src: string) => {
    if (!src || src === currentSrc()) return;
    setOverlayVisible(true);
    setNextSrc(src);

    try {
      await decodeImage(src);
      setIsTransitioning(true);
      const oldSrc = currentSrc();
      setCurrentSrc(src);
      window.setTimeout(() => {
        setNextSrc(null);
        setIsTransitioning(false);
        setOverlayVisible(false);
        if (oldSrc !== src && cache.size > MAX_RESIDENT_CACHE) cache.delete(oldSrc);
      }, FADE_DURATION_MS);
    } catch (error) {
      console.error("Landscape decode failed", error);
      setNextSrc(null);
      setIsTransitioning(false);
      setOverlayVisible(false);
    }
  };

  onMount(() => {
    window.requestIdleCallback?.(() => {
      const list = candidates();
      if (list.length > 1) void decodeImage(list[1]).catch(() => undefined);
      setOverlayVisible(false);
    });
  });

  createEffect(() => {
    const list = candidates();
    if (list.length === 0) return;
    const idx = list.indexOf(currentSrc());
    const next = list[(idx + 1 + list.length) % list.length];
    if (next) void decodeImage(next).catch(() => undefined);
  });

  const timer = window.setInterval(() => {
    const list = candidates();
    if (list.length < 2) return;
    const idx = list.indexOf(currentSrc());
    const next = list[(idx + 1 + list.length) % list.length];
    void switchTo(next);
  }, 30000);

  onCleanup(() => window.clearInterval(timer));

  return (
    <div class="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div class="absolute inset-0 bg-cover bg-center transition-opacity duration-300" style={{ "background-image": `url(${currentSrc()})` }} />
      <Show when={nextSrc()}>
        <div
          class="absolute inset-0 bg-cover bg-center transition-opacity"
          style={{ "background-image": `url(${nextSrc()})`, "transition-duration": `${FADE_DURATION_MS}ms`, opacity: isTransitioning() ? 1 : 0 }}
        />
      </Show>
      <div
        class="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: overlayVisible() ? 0.35 : 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.45))" }}
      />
    </div>
  );
}
