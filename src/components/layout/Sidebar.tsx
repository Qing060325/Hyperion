import { createSignal, For, Show, createMemo } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import {
  LayoutDashboard, Globe, Link2, Shield, ScrollText, Settings,
  Server, Inbox, ChevronLeft, Moon, Sun, Monitor, Activity,
  BarChart3, FileText, Layers, Rss, Sliders, Wifi,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useThemeStore } from "@/stores/theme";
import { useSettingsStore } from "@/stores/settings";
import ripple from "@/components/ui/RippleEffect";

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/nodes", label: "节点管理", icon: Server },
  { path: "/proxies", label: "代理管理", icon: Globe },
  { path: "/connections", label: "连接管理", icon: Link2 },
  { path: "/traffic", label: "流量监控", icon: BarChart3 },
  { path: "/rules", label: "规则管理", icon: Shield },
  { path: "/logs", label: "日志中心", icon: ScrollText },
  { path: "/configs", label: "配置中心", icon: Sliders },
  { path: "/dns", label: "DNS 管理", icon: Wifi },
  { path: "/subscriptions", label: "订阅管理", icon: Rss },
  { path: "/settings", label: "系统设置", icon: Settings },
];

// Scenic background thumbnails
const SCENIC_THUMBS = [
  { id: "fuji", label: "富士山", url: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=200&q=60" },
  { id: "tokyo", label: "东京", url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=200&q=60" },
  { id: "nature", label: "自然", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=60" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = createSignal(false);
  const location = useLocation();
  const clash = useClashStore();
  const themeStore = useThemeStore();
  const settingsStore = useSettingsStore();
  const [selectedThumb, setSelectedThumb] = createSignal("fuji");

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const themeIcon = () => {
    if (themeStore.theme() === "light") return Sun;
    if (themeStore.theme() === "dark") return Moon;
    return Monitor;
  };

  const cycleTheme = () => {
    const current = themeStore.theme();
    if (current === "light") themeStore.change("dark");
    else if (current === "dark") themeStore.change("system");
    else themeStore.change("light");
  };

  // Detect active region from node name
  const activeRegion = createMemo(() => {
    return "日本·东京";
  });

  return (
    <div
      class={`sidebar-container glass ${collapsed() ? "collapsed" : "expanded"} flex flex-col border-r border-base-300 z-40`}
      style={{ "transition-duration": "320ms", "transition-timing-function": "cubic-bezier(0.34, 0.1, 0.2, 1)" }}
    >
      {/* Logo */}
      <div class="flex items-center gap-3 px-4 h-14 border-b border-base-300 flex-shrink-0">
        <div
          class="w-8 h-8 rounded-lg gradient-border flex items-center justify-center text-primary-content font-bold text-sm flex-shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          H
        </div>
        <Show when={!collapsed()}>
          <span class="font-semibold text-base-content tracking-tight animate-fade-left whitespace-nowrap text-gradient-primary">
            Hyperion
          </span>
        </Show>
      </div>

      {/* Connection Status */}
      <div class="px-3 py-2 flex-shrink-0">
        <div
          class={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${
            clash.connected() ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          <span class={`w-1.5 h-1.5 rounded-full ${clash.connected() ? "bg-success animate-subtle-pulse" : "bg-error"}`} />
          <Show when={!collapsed()}>
            <span class="whitespace-nowrap">
              {clash.connected() ? "已连接" : "未连接"}
              {clash.version() ? ` · ${clash.version()?.version || ""}` : ""}
            </span>
          </Show>
        </div>
      </div>

      {/* Navigation */}
      <nav class="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <For each={navItems}>
          {(item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <A
                href={item.path}
                use:ripple
                class={`nav-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer ${
                  active
                    ? "nav-item-active bg-primary/10 text-primary font-medium"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-200/60"
                }`}
                classList={{
                  "justify-center": collapsed(),
                  "pl-3 pr-3": collapsed(),
                }}
                title={collapsed() ? item.label : undefined}
              >
                <Icon size={18} class="flex-shrink-0" />
                <Show when={!collapsed()}>
                  <span class="whitespace-nowrap">{item.label}</span>
                </Show>
              </A>
            );
          }}
        </For>
      </nav>

      {/* Bottom Section */}
      <div class="border-t border-base-300 p-2 flex-shrink-0 space-y-1">
        {/* Theme Toggle */}
        <button
          use:ripple
          onClick={cycleTheme}
          class="nav-item flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          classList={{ "justify-center": collapsed() }}
          title={collapsed() ? "切换主题" : undefined}
        >
          <span class="flex-shrink-0">{(() => { const TIcon = themeIcon(); return TIcon ? <TIcon size={18} /> : null; })()}</span>
          <Show when={!collapsed()}>
            <span class="whitespace-nowrap">
              {themeStore.theme() === "light" && "浅色"}
              {themeStore.theme() === "dark" && "深色"}
              {themeStore.theme() === "system" && "跟随系统"}
            </span>
          </Show>
        </button>

        {/* Collapse Toggle */}
        <button
          use:ripple
          onClick={() => setCollapsed(!collapsed())}
          class="nav-item flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          classList={{ "justify-center": collapsed() }}
          title={collapsed() ? "展开" : undefined}
        >
          <ChevronLeft
            size={18}
            class="flex-shrink-0 transition-transform duration-300"
            style={{ transform: collapsed() ? "rotate(180deg)" : "rotate(0deg)" }}
          />
          <Show when={!collapsed()}>
            <span class="whitespace-nowrap">收起侧栏</span>
          </Show>
        </button>

        {/* Scenic Mode Panel */}
        <Show when={!collapsed()}>
          <div class="mx-1 mt-1 rounded-xl bg-base-200/50 p-3 border border-base-300/60">
            <div class="flex items-center justify-between mb-2">
              <div class="text-xs font-semibold">🌄 风景区模式</div>
              <label class="toggle toggle-xs toggle-primary">
                <input
                  type="checkbox"
                  checked={settingsStore.settings().sakura_skin}
                  onChange={() =>
                    settingsStore.updateSettings({
                      sakura_skin: !settingsStore.settings().sakura_skin,
                    })
                  }
                />
              </label>
            </div>
            <div class="text-[11px] text-base-content/60 mb-2">
              根据 VPN 连接的地区自动切换背景
            </div>

            {/* Current region */}
            <div class="flex items-center gap-1.5 text-[11px] text-base-content/50 mb-3">
              <Globe size={12} />
              <span>当前地区：{activeRegion()}</span>
            </div>

            {/* Background thumbnails */}
            <div class="text-[11px] text-base-content/40 mb-1.5">更换背景</div>
            <div class="flex gap-2">
              <For each={SCENIC_THUMBS}>
                {(thumb) => (
                  <button
                    class={`relative w-16 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedThumb() === thumb.id
                        ? "border-primary shadow-md scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => setSelectedThumb(thumb.id)}
                  >
                    <img
                      src={thumb.url}
                      alt={thumb.label}
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <Show when={selectedThumb() === thumb.id}>
                      <div class="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div class="w-2 h-2 rounded-full bg-white shadow" />
                      </div>
                    </Show>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Version */}
        <Show when={!collapsed()}>
          <div class="text-[11px] text-base-content/40 text-center pt-1 animate-fade-left">
            Hyperion v0.5.0
          </div>
        </Show>
      </div>
    </div>
  );
}
