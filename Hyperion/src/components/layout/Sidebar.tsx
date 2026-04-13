import { createSignal, For } from "solid-js";
import { A, useNavigate, useLocation } from "@solidjs/router";
import {
  LayoutDashboard,
  Globe,
  Link2,
  Shield,
  ScrollText,
  Settings,
  Server,
  Inbox,
  ChevronLeft,
  Zap,
} from "lucide-solid";
import { useClashStore } from "@/stores/clash";
import { useThemeStore } from "@/stores/theme";
import { Moon, Sun, Monitor } from "lucide-solid";

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/proxies", label: "代理", icon: Globe },
  { path: "/connections", label: "连接", icon: Link2 },
  { path: "/rules", label: "规则", icon: Shield },
  { path: "/logs", label: "日志", icon: ScrollText },
  { path: "/configs", label: "配置", icon: Settings },
  { path: "/dns", label: "DNS", icon: Server },
  { path: "/subscriptions", label: "订阅", icon: Inbox },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = createSignal(false);
  const navigate = useNavigate();
  const location = useLocation();
  const clash = useClashStore();
  const themeStore = useThemeStore();

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
      class={`sidebar-container glass ${collapsed() ? "collapsed" : "expanded"} flex flex-col border-r border-base-300 z-40`}
      style={{ "transition-duration": "320ms", "transition-timing-function": "cubic-bezier(0.34, 0.1, 0.2, 1)" }}
    >
      {/* Logo */}
      <div class="flex items-center gap-3 px-4 h-14 border-b border-base-300 flex-shrink-0">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold text-sm flex-shrink-0">
          H
        </div>
        {!collapsed() && (
          <span class="font-semibold text-base-content tracking-tight animate-fade-left whitespace-nowrap">
            Hyperion
          </span>
        )}
      </div>

      {/* Connection Status */}
      <div class="px-3 py-2 flex-shrink-0">
        <div
          class={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
            clash.connected()
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          <span
            class={`w-1.5 h-1.5 rounded-full ${
              clash.connected() ? "bg-success animate-subtle-pulse" : "bg-error"
            }`}
          />
          {!collapsed() && (
            <span class="whitespace-nowrap">
              {clash.connected() ? "已连接" : "未连接"}
              {clash.version() ? ` · ${clash.version()?.version || ""}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav class="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        <For each={navItems}>
          {(item, index) => {
            const Icon = item.icon;
            return (
              <A
                href={item.path}
                class={`nav-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-200/60"
                }`}
                style={{ "animation-delay": `${index() * 30}ms` }}
                classList={{
                  "justify-center": collapsed(),
                  "pl-3 pr-3": collapsed(),
                  "border-l-2 border-primary": isActive(item.path),
                }}
                title={collapsed() ? item.label : undefined}
              >
                <Icon size={18} class="flex-shrink-0" />
                {!collapsed() && (
                  <span class="whitespace-nowrap">{item.label}</span>
                )}
              </A>
            );
          }}
        </For>
      </nav>

      {/* Bottom */}
      <div class="border-t border-base-300 p-2 flex-shrink-0 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          class="nav-item flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          classList={{ "justify-center": collapsed() }}
          title={collapsed() ? "切换主题" : undefined}
        >
          <span class="flex-shrink-0">{(() => { const TIcon = themeIcon(); return TIcon ? <TIcon size={18} /> : null; })()}</span>
          {!collapsed() && (
            <span class="whitespace-nowrap">
              {themeStore.theme() === "light" && "浅色"}
              {themeStore.theme() === "dark" && "深色"}
              {themeStore.theme() === "system" && "跟随系统"}
            </span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
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
          {!collapsed() && <span class="whitespace-nowrap">收起侧栏</span>}
        </button>

        {/* Version */}
        {!collapsed() && (
          <div class="text-[11px] text-base-content/40 text-center pt-1 animate-fade-left">
            v0.2.0-beta
          </div>
        )}
      </div>
    </div>
  );
}
