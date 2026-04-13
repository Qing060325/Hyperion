// ==========================================
// HotkeySettings - Hotkey Configuration
// ==========================================

import { For, Show, createSignal } from "solid-js";
import { Keyboard, Plus, Trash2, RefreshCw, AlertCircle } from "lucide-solid";
import type { HotkeyBinding } from "../../types/hotkey";
import { DEFAULT_HOTKEYS } from "../../types/hotkey";
import { hotkeyService } from "../../services/hotkeys";

interface HotkeySettingsProps {
  onReset?: () => void;
}

export default function HotkeySettings(props: HotkeySettingsProps) {
  const [bindings, setBindings] = createSignal<HotkeyBinding[]>(hotkeyService.getBindings());
  const [recording, setRecording] = createSignal<string | null>(null);

  const handleKeydown = (e: KeyboardEvent, binding: HotkeyBinding) => {
    if (recording() !== binding.id) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[] = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');
    
    if (modifiers.length === 0) return;
    
    const key = e.key.toUpperCase();
    if (['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) return;
    
    const updated = bindings().map(b =>
      b.id === binding.id
        ? { ...b, key, modifiers }
        : b
    );
    
    setBindings(updated);
    updated.forEach(b => hotkeyService.register(b));
    setRecording(null);
  };

  const toggleBinding = (id: string) => {
    const updated = bindings().map(b =>
      b.id === id ? { ...b, enabled: !b.enabled } : b
    );
    setBindings(updated);
    updated.forEach(b => hotkeyService.register(b));
  };

  const resetToDefaults = () => {
    hotkeyService.resetToDefaults();
    setBindings(hotkeyService.getBindings());
    props.onReset?.();
  };

  const formatBinding = (binding: HotkeyBinding) => {
    const parts = [...binding.modifiers, binding.key];
    return parts.join(' + ');
  };

  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold flex items-center gap-2">
          <Keyboard class="w-5 h-5" />
          快捷键设置
        </h3>
        <button class="btn btn-ghost btn-sm gap-1" onClick={resetToDefaults}>
          <RefreshCw class="w-4 h-4" />
          重置默认
        </button>
      </div>

      <div class="alert alert-info mb-4">
        <AlertCircle class="w-4 h-4" />
        <span class="text-sm">点击快捷键区域后按下新的组合键来修改</span>
      </div>

      <div class="space-y-2">
        <For each={bindings()}>
          {(binding) => (
            <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  checked={binding.enabled}
                  onChange={() => toggleBinding(binding.id)}
                />
                <div>
                  <div class="font-medium">{binding.actionLabel}</div>
                  <div class="text-xs text-base-content/50">{binding.description}</div>
                </div>
              </div>

              <Show when={recording() === binding.id}>
                <div class="badge badge-primary animate-pulse">
                  按下新快捷键...
                </div>
              </Show>

              <Show when={recording() !== binding.id}>
                <button
                  class="kbd kbd-lg cursor-pointer hover:bg-base-300 transition-colors"
                  onClick={() => setRecording(binding.id)}
                  onKeyDown={(e) => handleKeydown(e, binding)}
                  tabIndex={0}
                >
                  {formatBinding(binding)}
                </button>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
