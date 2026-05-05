import { createSignal, Show } from "solid-js";
import { Search, RotateCw, Moon, Sun, Menu, Bell, ChevronDown } from "lucide-solid";
import { useThemeStore } from "@/stores/theme";
import { useSettingsStore } from "@/stores/settings";

interface HeaderProps {
  breadcrumb?: string;
  onMenuClick?: () => void;
}

export default function Header(props: HeaderProps) {
  const themeStore = useThemeStore();
  const settingsStore = useSettingsStore();
  const [searchValue, setSearchValue] = createSignal("");

  const isDark = () => themeStore.resolved() === "dark";

  const toggleTheme = () => {
    themeStore.change(isDark() ? "light" : "dark");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header class="flex items-center justify-between py-4 mb-6">
      {/* Left: Breadcrumb */}
      <div class="flex items-center gap-3">
        <button
          class="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
          onClick={props.onMenuClick}
        >
          <Menu size={20} style={{ color: "var(--color-hyperion-text)" }} />
        </button>
        <Show when={props.breadcrumb}>
          <div class="flex items-center gap-2">
            <span
              class="text-sm font-medium"
              style={{ color: "var(--color-hyperion-text)" }}
            >
              {props.breadcrumb}
            </span>
          </div>
        </Show>
      </div>

      {/* Right: Actions */}
      <div class="flex items-center gap-3">
        {/* Search Box */}
        <div
          class="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-all focus-within:ring-2"
          style={{
            background: isDark() ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
            "--ring-color": "var(--color-hyperion-primary)",
          }}
        >
          <Search size={16} style={{ color: "var(--color-hyperion-text-muted)" }} />
          <input
            type="text"
            placeholder="搜索..."
            value={searchValue()}
            onInput={(e) => setSearchValue(e.currentTarget.value)}
            class="bg-transparent border-none outline-none text-sm w-32 lg:w-48"
            style={{ color: "var(--color-hyperion-text)" }}
          />
        </div>

        {/* Mobile Search Button */}
        <button
          class="sm:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: "var(--color-hyperion-text)" }}
        >
          <Search size={18} />
        </button>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          class="p-2 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: "var(--color-hyperion-text)" }}
          title="刷新页面"
        >
          <RotateCw size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          class="p-2 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: "var(--color-hyperion-text)" }}
          title={isDark() ? "切换到浅色模式" : "切换到深色模式"}
        >
          <Show when={isDark()} fallback={<Moon size={18} />}>
            <Sun size={18} />
          </Show>
        </button>

        {/* Notification Bell */}
        <button
          class="p-2 rounded-lg hover:bg-black/5 transition-colors relative"
          style={{ color: "var(--color-hyperion-text)" }}
        >
          <Bell size={18} />
          <span
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--color-hyperion-red)" }}
          />
        </button>

        {/* User Profile */}
        <div class="flex items-center gap-3 pl-3 ml-1" style={{ "border-left": "1px solid var(--color-hyperion-border)" }}>
          <div class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ background: "var(--gradient-primary)" }}
            >
              H
            </div>
            <span
              class="hidden lg:block text-sm font-medium"
              style={{ color: "var(--color-hyperion-text)" }}
            >
              Hyperion 管理员
            </span>
            <ChevronDown
              size={14}
              class="hidden lg:block"
              style={{ color: "var(--color-hyperion-text-muted)" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
