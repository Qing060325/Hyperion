import { createSignal, For } from "solid-js";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  exiting: boolean;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
let nextId = 0;

export function showToast(type: ToastType, message: string, duration = 3000) {
  const id = nextId++;
  setToasts((prev) => [...prev, { id, type, message, exiting: false }]);
  setTimeout(() => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, 300);
  }, duration);
}

const typeStyles: Record<ToastType, string> = {
  success: "border-success bg-success/10 text-success",
  error: "border-error bg-error/10 text-error",
  info: "border-primary bg-primary/10 text-primary",
  warning: "border-warning bg-warning/10 text-warning",
};

const typeIcons: Record<ToastType, string> = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };

export default function ToastContainer() {
  return (
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <For each={toasts()}>
        {(toast) => (
          <div class={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${typeStyles[toast.type]} ${toast.exiting ? "animate-toast-out" : "animate-toast-in"}`}>
            <span class="text-base">{typeIcons[toast.type]}</span>
            <span>{toast.message}</span>
          </div>
        )}
      </For>
    </div>
  );
}
