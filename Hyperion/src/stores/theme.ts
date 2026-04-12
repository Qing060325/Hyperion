import { createSignal, createEffect } from "solid-js";

export type Theme = "light" | "dark" | "system";

export function createThemeStore() {
  const [theme, setTheme] = createSignal<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = createSignal<"light" | "dark">("dark");

  const applyTheme = (t: Theme) => {
    let resolved: "light" | "dark";
    if (t === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = t;
    }
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.classList.toggle("light", resolved === "light");
  };

  createEffect(() => {
    applyTheme(theme());
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    applyTheme,
  };
}

let _themeStore: ReturnType<typeof createThemeStore> | null = null;

export function useThemeStore() {
  if (!_themeStore) {
    _themeStore = createThemeStore();
  }
  return _themeStore;
}
