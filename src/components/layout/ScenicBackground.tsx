import { Show, createMemo, createSignal, onMount } from "solid-js";
import { useThemeStore } from "@/stores/theme";
import { resolveBackground, type BackgroundResult, type TimeOfDay } from "@/features/scenic/backgroundProvider";

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 6) return "night";
  if (hour < 10) return "dawn";
  if (hour < 17) return "day";
  if (hour < 20) return "dusk";
  return "night";
}

export default function ScenicBackground() {
  const themeStore = useThemeStore();
  const [bg, setBg] = createSignal<BackgroundResult | null>(null);
  const [collapsed, setCollapsed] = createSignal(true);

  const showAttribution = createMemo(() => bg()?.attribution.provider === "third-party");

  onMount(async () => {
    const now = new Date();
    const result = await resolveBackground({
      country: "United States",
      city: "San Francisco",
      theme: themeStore.resolved(),
      timeOfDay: getTimeOfDay(now.getHours())
    });
    setBg(result);
  });

  return (
    <>
      <Show when={bg()}>
        {(result) => (
          <div class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <img
              src={result().imageUrl}
              alt="Scenic background"
              class="h-full w-full object-cover opacity-20"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </div>
        )}
      </Show>

      <Show when={showAttribution() && bg()}>
        {(result) => (
          <div class="absolute right-4 bottom-16 z-20 pointer-events-auto text-xs">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              onClick={() => setCollapsed((v) => !v)}
            >
              版权信息
            </button>
            <Show when={!collapsed()}>
              <div class="mt-1 rounded-md bg-base-100/85 px-2 py-1 backdrop-blur-sm">
                <span>Photo by </span>
                <a href={result().attribution.link} target="_blank" rel="noreferrer" class="link link-hover">
                  {result().attribution.text}
                </a>
                <span> on Unsplash</span>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </>
  );
}
