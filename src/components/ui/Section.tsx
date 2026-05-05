import type { ParentProps, JSX } from "solid-js";
import Card from "./Card";

interface SectionProps extends ParentProps {
  title: string;
  /** 右侧操作区 */
  action?: JSX.Element;
  class?: string;
}

/**
 * 带标题的卡片区块
 */
export default function Section(props: SectionProps) {
  return (
    <Card class={props.class}>
      <div class="flex items-center justify-between p-6 pb-4">
        <span style={{ "font-size": "16px", "font-weight": "600", color: "#333" }}>
          {props.title}
        </span>
        {props.action}
      </div>
      <div class="px-6 pb-6">{props.children}</div>
    </Card>
  );
}
