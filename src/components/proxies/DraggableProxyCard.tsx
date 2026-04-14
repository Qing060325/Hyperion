// ==========================================
// DraggableProxyCard - Proxy Card Component
// ==========================================

import { Show } from "solid-js";
import { Zap, Clock, Wifi, WifiOff } from "lucide-solid";
import type { ProxyInfo } from "../../types/clash";
import { getDelayColor } from "../../utils/color";
import ripple from "@/components/ui/RippleEffect";

interface DraggableProxyCardProps {
  proxy: ProxyInfo;
  isSelected: boolean;
  onSelect: () => void;
  onTestDelay: () => void;
}

export default function DraggableProxyCard(props: DraggableProxyCardProps) {
  const delay = () => props.proxy.history?.[0]?.delay ?? props.proxy.delay;
  
  const delayColor = () => {
    const d = delay();
    if (!d) return 'text-base-content/50';
    return getDelayColor(d);
  };

  const delayText = () => {
    const d = delay();
    if (!d) return '未测试';
    if (d === 0) return '超时';
    return `${d}ms`;
  };

  return (
    <div
      classList={{
        'card bg-base-200 border cursor-pointer transition-all duration-200 hover:border-primary/50 proxy-card': true,
        'border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10': props.isSelected,
        'border-transparent': !props.isSelected,
      }}
      onClick={props.onSelect}
      use:ripple
    >
      <div class="card-body p-3 flex-row items-center gap-3">
        {/* Type badge */}
        <div class="badge badge-outline badge-sm">
          {props.proxy.type}
        </div>

        {/* Info */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">{props.proxy.name}</span>
            <Show when={props.proxy.udp}>
              <span class="badge badge-xs badge-info">UDP</span>
            </Show>
          </div>
          <div class="text-xs text-base-content/50">
            {props.proxy.type === 'Selector' 
              ? `${props.proxy.all?.length || 0} 节点`
              : delayText()}
          </div>
        </div>

        {/* Delay indicator */}
        <Show when={props.proxy.type !== 'Selector' && props.proxy.type !== 'URLTest' && props.proxy.type !== 'Fallback'}>
          <div class="flex items-center gap-1">
            <button
              use:ripple
              class="btn btn-ghost btn-xs btn-circle"
              onClick={(e) => {
                e.stopPropagation();
                props.onTestDelay();
              }}
            >
              <Zap class="w-4 h-4" />
            </button>
            <div class={`flex items-center gap-1 text-sm font-medium ${delayColor()}`}>
              <Clock class="w-3 h-3" />
              {delayText()}
            </div>
          </div>
        </Show>

        {/* Status */}
        <Show when={props.proxy.alive !== undefined}>
          {props.proxy.alive ? (
            <Wifi class="w-4 h-4 text-success" />
          ) : (
            <WifiOff class="w-4 h-4 text-error" />
          )}
        </Show>
      </div>
    </div>
  );
}
