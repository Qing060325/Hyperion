import type { ParentProps } from "solid-js";

interface CardProps extends ParentProps {
  class?: string;
  /** 去掉默认内边距 */
  noPad?: boolean;
}

/**
 * 通用卡片容器 — 毛玻璃 + 圆角 + 轻阴影
 */
export default function Card(props: CardProps) {
  return (
    <div
      class={`card bg-base-100 animate-card-spring ${props.class ?? ""}`}
      style={{
        padding: props.noPad ? "0" : undefined,
      }}
    >
      {props.children}
    </div>
  );
}
