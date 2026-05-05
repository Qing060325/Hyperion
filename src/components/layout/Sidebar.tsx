import { createSignal, For, Show, createMemo } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import {
  LayoutDashboard, Globe, Link2, Shield, ScrollText, Settings,
  Server, Inbox, ChevronLeft, Moon, Sun, Monitor, Activity,
  BarChart3, Sliders, Wifi, Rss, Plus, Upload, HeartPulse,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useThemeStore } from "@/stores/theme";
import { useSettingsStore } from "@/stores/settings";

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/nodes", label: "节点管理", icon: Server },
  { path: "/proxies", label: "代理管理", icon: Globe },
  { path: "/connections", label: "连接管理", icon: Link2 },
  { path: "/traffic", label: "流量监控", icon: BarChart3 },
  { path: "/rules", label: "规则管理", icon: Shield },
  { path: "/logs", label: "日志中心", icon: ScrollText },
  { path: "/configs", label: "配置中心", icon: Sliders },
  { path: "/dns", label: "DNS管理", icon: Wifi },
  { path: "/subscriptions", label: "订阅管理", icon: Rss },
  { path: "/settings", label: "系统设置", icon: Settings },
];

const quickActions = [
  { label: "添加节点", icon: Plus },
  { label: "添加代理", icon: Plus },
  { label: "导入订阅", icon: Upload },
  { label: "系统状态", icon: HeartPulse },
];

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

  return (
    <div
      class={`sidebar-container ${collapsed() ? "collapsed" : "expanded"} flex flex-col z-40`}
      style={{ background: "var(--color-hyperion-sidebar-bg)", "transition-duration": "320ms", "transition-timing-function": "cubic-bezier(0.34, 0.1, 0.2, 1)" }}
    >
      {/* Logo */}
      <div class="flex items-center gap-3 px-5 h-16 flex-shrink-0">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          H
        </div>
        <Show when={!collapsed()}>
          <span
            class="font-semibold tracking-tight animate-fade-left whitespace-nowrap text-gradient-primary"
            style={{ "font-size": "15px" }}
          >
            Hyperion
          </span>
        </Show>
      </div>

      {/* Connection Status */}
      <div class="px-4 pb-2 flex-shrink-0">
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: clash.connected() ? "#F0F9F6" : "#FFF0F0",
            color: clash.connected() ? "#00C48C" : "#FF4757",
          }}
        >
          <span
            class="w-1.5 h-1.5 rounded-full animate-subtle-pulse"
            style={{ background: clash.connected() ? "#00C48C" : "#FF4757" }}
          />
          <Show when={!collapsed()}>
            <span class="whitespace-nowrap" style={{ "font-size": "12px" }}>
              {clash.connected() ? "已连接" : "未连接"}
              {clash.version() ? ` · ${clash.version()?.version || ""}` : ""}
            </span>
          </Show>
        </div>
      </div>

      {/* Navigation */}
      <nav class="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        <For each={navItems}>
          {(item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <A
                href={item.path}
                class={`nav-item flex items-center gap-3 cursor-pointer ${
                  active ? "nav-item-active" : ""
                }`}
                style={{
                  color: active ? "#534BFF" : "#666",
                  "font-weight": active ? "600" : "400",
                }}
                classList={{
                  "justify-center": collapsed(),
                }}
                title={collapsed() ? item.label : undefined}
              >
                <Icon size={18} class="flex-shrink-0" style={{ color: active ? "#534BFF" : "#999" }} />
                <Show when={!collapsed()}>
                  <span class="whitespace-nowrap">{item.label}</span>
                </Show>
              </A>
            );
          }}
        </For>

        {/* Quick Actions */}
        <Show when={!collapsed()}>
          <div class="pt-6">
            <div style={{ "font-size": "12px", color: "#999", padding: "0 12px", "margin-bottom": "8px" }}>
              快捷操作
            </div>
            <For each={quickActions}>
              {(action) => {
                const Icon = action.icon;
                return (
                  <div
                    class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-black/[0.03] transition-colors"
                    style={{ height: "36px" }}
                  >
                    <Icon size={16} style={{ color: "#999" }} />
                    <span style={{ "font-size": "14px", color: "#666", flex: 1 }}>{action.label}</span>
                    <Plus size={12} style={{ color: "#CCC" }} />
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </nav>

      {/* Bottom Section */}
      <div class="border-t px-3 py-3 flex-shrink-0 space-y-1" style={{ "border-color": "#F0F0F0" }}>
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-black/[0.03] transition-colors"
          style={{ color: "#666" }}
          classList={{ "justify-center": collapsed() }}
        >
          <span class="flex-shrink-0">{(() => { const TIcon = themeIcon(); return TIcon ? <TIcon size={18} style={{ color: "#999" }} /> : null; })()}</span>
          <Show when={!collapsed()}>
            <span class="whitespace-nowrap" style={{ "font-size": "14px" }}>
              {themeStore.theme() === "light" && "浅色"}
              {themeStore.theme() === "dark" && "深色"}
              {themeStore.theme() === "system" && "跟随系统"}
            </span>
          </Show>
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed())}
          class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-black/[0.03] transition-colors"
          style={{ color: "#666" }}
          classList={{ "justify-center": collapsed() }}
        >
          <ChevronLeft
            size={18}
            class="flex-shrink-0 transition-transform duration-300"
            style={{ color: "#999", transform: collapsed() ? "rotate(180deg)" : "rotate(0deg)" }}
          />
          <Show when={!collapsed()}>
            <span class="whitespace-nowrap" style={{ "font-size": "14px" }}>收起侧栏</span>
          </Show>
        </button>

        {/* Scenic Mode Panel */}
        <Show when={!collapsed()}>
          <div class="mx-1 mt-2 rounded-xl p-3" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--color-hyperion-border)" }}>
            {/* Header with toggle */}
            <div class="flex items-center justify-between mb-2">
              <div style={{ "font-size": "14px", "font-weight": "500", color: "var(--color-hyperion-text-secondary)" }}>🌄 风景模式</div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="sr-only peer"
                  checked={settingsStore.settings().sakura_skin}
                  onChange={() =>
                    settingsStore.updateSettings({ sakura_skin: !settingsStore.settings().sakura_skin })
                  }
                />
                <div
                  class="w-8 h-[18px] rounded-full peer peer-checked:after:translate-x-[14px] after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                  style={{
                    background: settingsStore.settings().sakura_skin ? "var(--color-hyperion-primary)" : "#E0E0E0",
                  }}
                />
              </label>
            </div>

            {/* Description */}
            <div style={{ "font-size": "12px", color: "var(--color-hyperion-text-muted)", "line-height": "18px" }}>
              根据 VPN 连接的地区自动切换背景
            </div>

            {/* Current Region */}
            <div class="flex items-center gap-1.5 mt-2" style={{ "font-size": "12px", color: "var(--color-hyperion-text-muted)" }}>
              <Globe size={12} />
              <span>当前地区：日本·东京</span>
            </div>

            {/* Opacity Slider */}
            <Show when={settingsStore.settings().sakura_skin}>
              <div class="mt-4 space-y-3">
                {/* Opacity Control */}
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span style={{ "font-size": "12px", color: "var(--color-hyperion-text-secondary)" }}>透明度</span>
                    <span style={{ "font-size": "11px", color: "var(--color-hyperion-text-muted)" }}>
                      {settingsStore.settings().scenic_opacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settingsStore.settings().scenic_opacity}
                    onInput={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      settingsStore.updateSettings({ scenic_opacity: value });
                      e.currentTarget.style.setProperty('--value-percent', `${value}%`);
                    }}
                    class="scenic-slider w-full"
                    style={{ "--value-percent": `${settingsStore.settings().scenic_opacity}%` }}
                  />
                </div>

                {/* Blur Control */}
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span style={{ "font-size": "12px", color: "var(--color-hyperion-text-secondary)" }}>模糊度</span>
                    <span style={{ "font-size": "11px", color: "var(--color-hyperion-text-muted)" }}>
                      {settingsStore.settings().scenic_blur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settingsStore.settings().scenic_blur}
                    onInput={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      settingsStore.updateSettings({ scenic_blur: value });
                      e.currentTarget.style.setProperty('--value-percent', `${(value / 20) * 100}%`);
                    }}
                    class="scenic-slider w-full"
                    style={{ "--value-percent": `${(settingsStore.settings().scenic_blur / 20) * 100}%` }}
                  />
                </div>
              </div>
            </Show>

            {/* Background Thumbnails */}
            <div style={{ "font-size": "12px", color: "var(--color-hyperion-text-muted)", "margin-top": "12px", "margin-bottom": "6px" }}>
              更换背景
            </div>
            <div class="flex gap-2">
              <For each={SCENIC_THUMBS}>
                {(thumb) => (
                  <button
                    class="relative overflow-hidden transition-all duration-200"
                    style={{
                      width: "50px",
                      height: "40px",
                      "border-radius": "4px",
                      border: selectedThumb() === thumb.id ? "2px solid var(--color-hyperion-primary)" : "1px solid var(--color-hyperion-border)",
                      opacity: selectedThumb() === thumb.id ? "1" : "0.7",
                    }}
                    onClick={() => setSelectedThumb(thumb.id)}
                  >
                    <img src={thumb.url} alt={thumb.label} class="w-full h-full object-cover" loading="lazy" />
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Footer */}
        <Show when={!collapsed()}>
          <div class="flex items-center justify-between px-2 pt-2">
            <div class="flex items-center gap-2">
              <span style={{ "font-size": "14px", "font-weight": "600", color: "#333" }}>Hyperion</span>
              <span style={{ "font-size": "12px", color: "#999" }}>v0.5.0</span>
            </div>
            <div class="flex items-center gap-4">
              <Settings size={16} style={{ color: "#999", cursor: "pointer" }} />
              <ScrollText size={16} style={{ color: "#999", cursor: "pointer" }} />
              <Monitor size={16} style={{ color: "#999", cursor: "pointer" }} />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
