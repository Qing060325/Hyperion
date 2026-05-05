import type { ParentProps } from "solid-js";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import PageTransition from "@/components/ui/PageTransition";
import ScenicBackdrop from "@/components/scenic/ScenicBackdrop";
import SakuraCanvas from "@/components/sakura/SakuraCanvas";

/**
 * 统一页面布局容器
 * - 侧栏 + 主内容区 + 移动端导航
 * - 背景装饰层（风景 / 樱花）
 * - 页面切换动画
 */
export default function MainLayout(props: ParentProps) {
  return (
    <div class="app-layout bg-base-200 noise-bg">
      <ScenicBackdrop />
      <SakuraCanvas />
      <Sidebar />
      <main class="main-content" style={{ position: "relative", "z-index": 1 }}>
        <div class="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <PageTransition>{props.children}</PageTransition>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
