import { A, useLocation } from "@solidjs/router";
import { LayoutDashboard, Globe, Link2, ScrollText, Settings } from "lucide-solid";
import ripple from "@/components/ui/RippleEffect";

const navItems = [
  { path: "/", label: "首页", icon: LayoutDashboard },
  { path: "/proxies", label: "代理", icon: Globe },
  { path: "/connections", label: "连接", icon: Link2 },
  { path: "/logs", label: "日志", icon: ScrollText },
  { path: "/settings", label: "设置", icon: Settings },
];

export default function MobileNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div class="mobile-nav items-center justify-around px-2 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <A
            href={item.path}
            use:ripple
            class={`mobile-nav-item flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              active
                ? "mobile-nav-item-active text-primary"
                : "text-base-content/50"
            }`}
          >
            <Icon size={20} />
            <span class="text-[10px] font-medium">{item.label}</span>
          </A>
        );
      })}
    </div>
  );
}
