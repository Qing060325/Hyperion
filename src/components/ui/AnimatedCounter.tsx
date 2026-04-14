import { createSignal, createEffect, on } from "solid-js";

interface AnimatedCounterProps {
  value: number;
  format?: (n: number) => string;
  class?: string;
}

export default function AnimatedCounter(props: AnimatedCounterProps) {
  const [animating, setAnimating] = createSignal(false);
  let ref: HTMLSpanElement | undefined;

  const formatValue = () => {
    if (props.format) return props.format(props.value);
    return String(props.value);
  };

  createEffect(on(() => props.value, () => {
    setAnimating(true);
    if (ref) {
      ref.classList.remove("animate-counter");
      // Force reflow to restart animation
      void ref.offsetWidth;
      ref.classList.add("animate-counter");
    }
    setTimeout(() => setAnimating(false), 300);
  }));

  return (
    <span ref={ref} class={props.class}>
      {formatValue()}
    </span>
  );
}
