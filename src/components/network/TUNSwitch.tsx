// ==========================================
// TUNSwitch - TUN Mode Toggle
// ==========================================

import { createSignal, Show } from "solid-js";
import { Router, Wifi, AlertTriangle, Loader2 } from "lucide-solid";
import type { TunConfig } from "../../types/clash";

interface TUNSwitchProps {
  config: TunConfig | null;
  onChange: (enabled: boolean) => void;
  loading?: boolean;
}

export default function TUNSwitch(props: TUNSwitchProps) {
  const isEnabled = () => props.config?.enable ?? false;

  return (
    <div class="card bg-base-200 border border-base-300">
      <div class="card-body p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class={`p-2 rounded-lg ${isEnabled() ? 'bg-primary/20 text-primary' : 'bg-base-300 text-base-content/50'}`}>
              <Router class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-semibold">TUN 模式</h3>
              <p class="text-xs text-base-content/50">
                {isEnabled() ? '系统级代理已启用' : '系统级代理未启用'}
              </p>
            </div>
          </div>

          <Show when={props.loading}>
            <Loader2 class="w-5 h-5 animate-spin text-primary" />
          </Show>

          <Show when={!props.loading}>
            <input
              type="checkbox"
              class="toggle toggle-primary toggle-lg"
              checked={isEnabled()}
              onChange={(e) => props.onChange(e.currentTarget.checked)}
            />
          </Show>
        </div>

        <Show when={isEnabled() && props.config}>
          <div class="divider my-2"></div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-1">
              <Wifi class="w-3 h-3" />
              <span class="text-base-content/50">Stack:</span>
              <span class="font-medium">{props.config?.stack || 'gvisor'}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-base-content/50">自动路由:</span>
              <span class="font-medium">{props.config?.auto_route ? '是' : '否'}</span>
            </div>
          </div>
        </Show>

        <Show when={!isEnabled()}>
          <div class="alert alert-warning mt-2 py-2">
            <AlertTriangle class="w-4 h-4" />
            <span class="text-xs">启用 TUN 模式需要管理员权限</span>
          </div>
        </Show>
      </div>
    </div>
  );
}
