import type { ParentProps } from "solid-js";
import { createMemo } from "solid-js";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import PageTransition from "@/components/ui/PageTransition";
import ScenicBackdrop from "@/components/scenic/ScenicBackdrop";
import SceneOverlay from "@/components/scenic/SceneOverlay";
import SceneBadge from "@/components/scenic/SceneBadge";
import SakuraCanvas from "@/components/sakura/SakuraCanvas";
import { useSceneStore } from "@/stores/scene";

/**
 * 统一页面布局容器
 * 风景层 → 遮罩层 → 内容层
 */
export default function MainLayout(props: ParentProps) {
  const scene = useSceneStore();

  /** 将场景 CSS 变量注入到布局根节点 */
  const layoutStyle = createMemo(() => ({
    "--scene-color": scene.themeColor(),
    "--scene-time": scene.timeOfDay(),
    "--scene-temperature": scene.temperature(),
  }));

  return (
    <div class="app-layout bg-base-200 noise-bg" style={layoutStyle()}>
      {/* Layer 1: 风景背景 */}
      <ScenicBackdrop />

      {/* Layer 2: 渐变遮罩（保证可读性） */}
      <SceneOverlay />

      {/* Layer 3: 樱花粒子 */}
      <SakuraCanvas />

      {/* Layer 4: 场景信息浮标 */}
      <SceneBadge />

      {/* Layer 5: 侧栏 */}
      <Sidebar />

      {/* Layer 6: 主内容 */}
      <main class="main-content" style={{ position: "relative", "z-index": 1 }}>
        <div class="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <PageTransition>{props.children}</PageTransition>
        </div>
      </main>

      {/* Layer 7: 移动端导航 */}
      <MobileNav />
    </div>
  );
}
