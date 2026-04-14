import { createSignal } from "solid-js";
import zhCN from "./zh-CN";
import en from "./en";
import type { TranslationKeys } from "./zh-CN";

type Locale = "zh-CN" | "en";

const messages: Record<Locale, TranslationKeys> = {
  "zh-CN": zhCN,
  en,
};

const [locale, setLocale] = createSignal<Locale>("zh-CN");

export function useI18n() {
  const t = () => messages[locale()];

  const switchLocale = (l: Locale) => {
    setLocale(l);
    try {
      localStorage.setItem("hyperion-locale", l);
    } catch { /* ignore */ }
  };

  const initLocale = () => {
    try {
      const saved = localStorage.getItem("hyperion-locale") as Locale;
      if (saved && messages[saved]) {
        setLocale(saved);
      }
    } catch { /* ignore */ }
  };

  return {
    t,
    locale,
    setLocale: switchLocale,
    initLocale,
  };
}
