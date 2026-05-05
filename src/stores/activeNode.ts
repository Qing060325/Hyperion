import { createSignal } from "solid-js";

/**
 * 全局活动节点信号
 * App.tsx 中写入，Sidebar 和 ScenicBackdrop 中读取
 */
const [activeNode, setActiveNode] = createSignal("");

export { activeNode, setActiveNode };
