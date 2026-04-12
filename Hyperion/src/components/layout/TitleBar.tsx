import { createSignal } from "solid-js";
import { useI18n } from "../../i18n";

export function TitleBar() {
  const [maximized, setMaximized] = createSignal(false);

  const handleMinimize = () => {
    // Tauri API - window minimize
    if (window.__TAURI_INTERNALS__) {
      window.__TAURI_INTERNALS__.invoke("plugin:window|minimize", { label: "main" });
    }
  };

  const handleMaximize = () => {
    if (window.__TAURI_INTERNALS__) {
      if (maximized()) {
        window.__TAURI_INTERNALS__.invoke("plugin:window|unmaximize", { label: "main" });
      } else {
        window.__TAURI_INTERNALS__.invoke("plugin:window|maximize", { label: "main" });
      }
    }
    setMaximized(!maximized());
  };

  const handleClose = () => {
    if (window.__TAURI_INTERNALS__) {
      window.__TAURI_INTERNALS__.invoke("plugin:window|close", { label: "main" });
    }
  };

  return (
    <div
      class="flex items-center justify-between h-9 px-4 select-none"
      style={{
        background: "var(--bg-secondary)",
        "border-bottom": "1px solid var(--border-default)",
      }}
      data-tauri-drag-region
    >
      {/* App icon and name */}
      <div class="flex items-center gap-2" data-tauri-drag-region>
        {/* Logo */}
        <div class="w-5 h-5 rounded flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            "box-shadow": "0 0 10px rgba(6, 182, 212, 0.3)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span class="text-xs font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
          Hyperion
        </span>
      </div>

      {/* Window controls */}
      <div class="flex items-center -mr-2">
        <button
          onClick={handleMinimize}
          class="w-11 h-9 flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" rx="0.5" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          class="w-11 h-9 flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          class="w-11 h-9 flex items-center justify-center transition-colors duration-150 hover:bg-red-500 hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
