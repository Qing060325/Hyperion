import { A, useLocation } from "@solidjs/router";
import { useI18n } from "../../i18n";
import { Show, createSignal, For } from "solid-js";
import { useClashStore } from "../../stores/clash";

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", labelKey: "dashboard", icon: "dashboard" },
  { path: "/proxies", labelKey: "proxies", icon: "globe" },
  { path: "/connections", labelKey: "connections", icon: "link" },
  { path: "/rules", labelKey: "rules", icon: "scroll" },
  { path: "/logs", labelKey: "logs", icon: "terminal" },
  { path: "/configs", labelKey: "configs", icon: "file-text" },
  { path: "/dns", labelKey: "dns", icon: "database" },
  { path: "/subscriptions", labelKey: "subscriptions", icon: "radio" },
  { path: "/settings", labelKey: "settings", icon: "settings" },
];

// SVG icon components
function NavIcon(props: { name: string; class?: string }) {
  const iconPaths: Record<string, string> = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
    scroll: "M13 20h-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2h2c2.21 0 4-1.79 4-4s-1.79-4-4-4zm0 6h-2v-4h2c1.1 0 2 .9 2 2s-.9 2-2 2zM4 6h5v14H4V6z",
    terminal: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v12zM6 12l4 2-4 2v-4z",
    "file-text": "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41-1.42L11 15.16l1.59-1.59L14 15.01l-2 2-2-2z",
    database: "M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zm0 2c4.42 0 8 1.57 8 3.5S16.42 11 12 11 4 9.43 4 7.5 7.58 4 12 4zM4 17.5V14c1.94 1.46 4.84 2.5 8 2.5s6.06-1.04 8-2.5v3.5c0 1.93-3.58 3.5-8 3.5s-8-1.57-8-3.5z",
    radio: "M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34-.37-.92L3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z",
    settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z",
  };

  return (
    <svg class={props.class} viewBox="0 0 24 24" fill="currentColor">
      <path d={iconPaths[props.name] || iconPaths.dashboard} />
    </svg>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { t } = useI18n();
  const clash = useClashStore();
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <aside
      class="flex flex-col h-full transition-all duration-300 relative"
      style={{
        width: collapsed() ? "56px" : "180px",
        "min-width": collapsed() ? "56px" : "180px",
        background: "var(--bg-secondary)",
        "border-right": "1px solid var(--border-default)",
      }}
    >
      {/* Navigation items */}
      <nav class="flex-1 py-3 px-1 overflow-y-auto overflow-x-hidden">
        <For each={navItems}>
          {(item) => {
            const isActive = () =>
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <A
                href={item.path}
                class="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-all duration-200 group no-underline"
                style={{
                  "background": isActive() ? "var(--accent-muted)" : "transparent",
                  color: isActive() ? "var(--accent)" : "var(--text-secondary)",
                  "border-left": isActive()
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                }}
                onMouseenter={(e) => {
                  if (!isActive()) {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }
                }}
                onMouseleave={(e) => {
                  if (!isActive()) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                }}
              >
                <span class="flex-shrink-0 w-5 h-5">
                  <NavIcon name={item.icon} class="w-full h-full" />
                </span>
                <Show when={!collapsed()}>
                  <span class="text-xs font-medium whitespace-nowrap">
                    {(t().nav as Record<string, string>)[item.labelKey] || item.labelKey}
                  </span>
                </Show>
              </A>
            );
          }}
        </For>
      </nav>

      {/* Connection status indicator */}
      <div class="px-3 py-2 mx-2 mb-2 rounded-lg" style={{
        background: clash.connected() ? "var(--success-muted)" : "var(--error-muted)",
        "border": `1px solid ${clash.connected() ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      }}>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" style={{
            background: clash.connected() ? "var(--success)" : "var(--error)",
            "box-shadow": clash.connected() ? "0 0 8px rgba(16,185,129,0.5)" : "0 0 8px rgba(239,68,68,0.5)",
          }} />
          <Show when={!collapsed()}>
            <span class="text-xs" style={{ color: clash.connected() ? "var(--success)" : "var(--error)" }}>
              {clash.connected() ? t().connection.connected : t().connection.disconnected}
            </span>
          </Show>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed())}
        class="flex items-center justify-center py-2 mx-2 mb-2 rounded-lg transition-colors duration-200"
        style={{
          color: "var(--text-tertiary)",
          border: "1px solid var(--border-subtle)",
        }}
        onMouseenter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
        }}
        onMouseleave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
        }}
      >
        <svg
          class="w-4 h-4 transition-transform duration-300"
          style={{ transform: collapsed() ? "rotate(180deg)" : "rotate(0deg)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
  );
}
