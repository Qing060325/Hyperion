// ==========================================
// RuleTypeSelector - Visual Rule Type Selector
// ==========================================

import { For, Show } from "solid-js";
import type { RuleType, RuleTypeCategory } from "../../types/rule-editor";
import { RULE_TYPES, getRuleTypesByCategory, getRuleTypeMeta } from "../../types/rule-editor";
import { Globe, Server, MapPin, Cpu, Plug, GitBranch, MoreHorizontal } from "lucide-solid";

interface RuleTypeSelectorProps {
  value: RuleType;
  onChange: (type: RuleType) => void;
}

const CATEGORY_ICONS: Record<RuleTypeCategory, any> = {
  domain: Globe,
  ip: Server,
  geo: MapPin,
  process: Cpu,
  port: Plug,
  logical: GitBranch,
  other: MoreHorizontal,
};

const CATEGORY_NAMES: Record<RuleTypeCategory, string> = {
  domain: '域名规则',
  ip: 'IP 规则',
  geo: '地理位置',
  process: '进程规则',
  port: '端口规则',
  logical: '逻辑规则',
  other: '其他规则',
};

export default function RuleTypeSelector(props: RuleTypeSelectorProps) {
  const categories: RuleTypeCategory[] = ['domain', 'ip', 'geo', 'process', 'port', 'logical', 'other'];

  return (
    <div class="space-y-4">
      <For each={categories}>
        {(category) => {
          const types = () => getRuleTypesByCategory(category);
          const Icon = CATEGORY_ICONS[category];
          
          return (
            <Show when={types().length > 0}>
              <div>
                <h4 class="font-medium text-sm text-base-content/70 mb-2 flex items-center gap-2">
                  <Icon class="w-4 h-4" />
                  {CATEGORY_NAMES[category]}
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <For each={types()}>
                    {(type) => (
                      <button
                        classList={{
                          'btn text-left h-auto py-2 px-3': true,
                          'btn-primary': props.value === type.type,
                          'btn-ghost': props.value !== type.type,
                        }}
                        onClick={() => props.onChange(type.type)}
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-lg">{type.icon}</span>
                          <div>
                            <div class="text-sm font-medium">{type.name}</div>
                            <div class="text-xs text-base-content/50 truncate max-w-[120px]">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          );
        }}
      </For>
    </div>
  );
}
