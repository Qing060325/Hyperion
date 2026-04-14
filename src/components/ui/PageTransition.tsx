import { onMount, createEffect } from "solid-js";
import { useLocation } from "@solidjs/router";
import type { ParentProps } from "solid-js";

export default function PageTransition(props: ParentProps) {
  const location = useLocation();
  let containerRef: HTMLDivElement | undefined;

  const triggerAnimation = () => {
    if (!containerRef) return;
    containerRef.classList.remove("animate-page-in-enhanced");
    void containerRef.offsetWidth;
    containerRef.classList.add("animate-page-in-enhanced");
  };

  onMount(() => { triggerAnimation(); });

  createEffect(() => { location.pathname; triggerAnimation(); });

  return <div ref={containerRef} class="animate-page-in-enhanced">{props.children}</div>;
}
