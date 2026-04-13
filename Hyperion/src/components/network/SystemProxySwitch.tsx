// ==========================================
// SystemProxySwitch - System Proxy Toggle
// ==========================================

import { createSignal, Show } from "solid-js";
import { Globe, Settings, Loader2 } from "lucide-solid";
import type { SystemProxyConfig } from "../../types/hotkey";

interface SystemProxySwitchProps {
  config: SystemProxyConfig | null;
  onChange: (enabled: boolean) => void;
  onConfigure?: () => void;
  loading?: boolean;
}

export default function SystemProxySwitch(props: SystemProxySwitchProps) {
  const isEnabled = () => props.config?.enabled ?? false;

  return (
    <div class="card bg-base-200 border border-base-300">
      <div class="card-body p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class={`p-2 rounded-lg ${isEnabled() ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/50'}`}>
              <Globe class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-semibold">系统代理</h3>
              <p class="text-xs text-base-content/50">
                {isEnabled() ? '已设置为系统代理' : '未设置系统代理'}
              </p>
            </div>
          </div>

          <Show when={props.loading}>
            <Loader2 class="w-5 h-5 animate-spin text-primary" />
          </Show>

          <Show when={!props.loading}>
            <input
              type="checkbox"
              class="toggle toggle-success toggle-lg"
              checked={isEnabled()}
              onChange={(e) => props.onChange(e.currentTarget.checked)}
            />
          </Show>
        </div>

        <Show when={isEnabled() && props.config}>
          <div class="divider my-2"></div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-base-content/50">HTTP:</span>
              <span class="font-mono">{props.config?.http || '-'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/50">HTTPS:</span>
              <span class="font-mono">{props.config?.https || '-'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/50">SOCKS:</span>
              <span class="font-mono">{props.config?.socks || '-'}</span>
            </div>
          </div>
        </Show>

        <Show when={props.onConfigure}>
          <button
            class="btn btn-ghost btn-sm btn-block mt-2 gap-1"
            onClick={props.onConfigure}
          >
            <Settings class="w-4 h-4" />
            高级设置
          </button>
        </Show>
      </div>
    </div>
  );
}
