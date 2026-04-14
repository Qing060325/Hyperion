import { onCleanup } from "solid-js";

/**
 * SolidJS directive: use:ripple
 * Adds material-design ripple effect on click.
 * Usage: <button use:ripple>Click me</button>
 * Optional: data-ripple-color="rgba(255,255,255,0.3)"
 */
export default function ripple(el: HTMLElement, accessor: () => any) {
  const handler = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const rippleEl = document.createElement("span");
    rippleEl.style.cssText = `
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      opacity: 0.5;
      pointer-events: none;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      background: ${el.dataset.rippleColor || "rgba(0, 122, 255, 0.25)"};
      animation: ripple 600ms ease-out forwards;
    `;

    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.appendChild(rippleEl);

    rippleEl.addEventListener("animationend", () => rippleEl.remove());
  };

  el.addEventListener("mousedown", handler);
  onCleanup(() => el.removeEventListener("mousedown", handler));
}

// Register as SolidJS directive
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      ripple: boolean | string;
    }
  }
}
