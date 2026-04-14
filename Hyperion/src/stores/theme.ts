import { createSignal, createEffect, onMount } from "solid-js";
import { Moon, Sun, Monitor } from "lucide-solid";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "hyperion-theme";

function createThemeStore() {
  const [theme, setTheme] = createSignal<Theme>(
    (localStorage.getItem(STORAGE_KEY) as Theme) || "system"
  );
  const [resolved, setResolved] = createSignal<"light" | "dark">("dark");

  const resolve = (t: Theme) => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return t;
  };

  const apply = (t: Theme) => {
    const r = resolve(t);
    setResolved(r);
    document.documentElement.setAttribute("data-theme", r);
  };

  const change = (t: Theme) => {
    setTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
    apply(t);
  };

  createEffect(() => {
    apply(theme());
  });

  onMount(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme() === "system") apply("system");
    };
    mq.addEventListener("change", handler);
  });

  return { theme, resolved, change };
}

let _store: ReturnType<typeof createThemeStore> | null = null;
export function useThemeStore() {
  if (!_store) _store = createThemeStore();
  return _store;
}
