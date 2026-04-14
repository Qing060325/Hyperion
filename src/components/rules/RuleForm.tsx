// ==========================================
// RuleForm - Rule Form Editor
// ==========================================

import { For, Show } from "solid-js";
import type { RuleFormData, RuleType } from "../../types/rule-editor";
import { RULE_TYPES, getRuleTypeMeta, getRuleTypesByCategory } from "../../types/rule-editor";

interface RuleFormProps {
  rule: RuleFormData;
  proxies: string[];
  onChange: (updates: Partial<RuleFormData>) => void;
}

export default function RuleForm(props: RuleFormProps) {
  const meta = () => getRuleTypeMeta(props.rule.type);
  const categories = () => ['domain', 'ip', 'geo', 'process', 'port', 'logical', 'other'] as const;

  const getPlaceholder = () => {
    switch (props.rule.type) {
      case 'DOMAIN':
      case 'DOMAIN-SUFFIX':
      case 'DOMAIN-KEYWORD':
        return '例如: google.com';
      case 'DOMAIN-REGEX':
        return '例如: ^.*google.*$';
      case 'IP-CIDR':
      case 'IP-CIDR6':
        return '例如: 192.168.1.0/24';
      case 'GEOIP':
      case 'SRC-GEOIP':
        return '例如: CN';
      case 'GEOSITE':
        return '例如: google';
      case 'PROCESS-NAME':
        return '例如: chrome.exe';
      case 'DST-PORT':
      case 'SRC-PORT':
        return '例如: 443';
      case 'RULE-SET':
        return '规则集名称';
      default:
        return '输入匹配内容';
    }
  };

  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Rule Type */}
      <div class="form-control">
        <label class="label">
          <span class="label-text">规则类型</span>
        </label>
        <select
          class="select select-bordered w-full"
          value={props.rule.type}
          onChange={(e) => props.onChange({ type: e.currentTarget.value as RuleType })}
        >
          <For each={categories()}>
            {(category) => (
              <optgroup label={category.toUpperCase()}>
                <For each={getRuleTypesByCategory(category)}>
                  {(type) => (
                    <option value={type.type}>
                      {type.icon} {type.name}
                    </option>
                  )}
                </For>
              </optgroup>
            )}
          </For>
        </select>
        <label class="label">
          <span class="label-text-alt text-base-content/50">
            {meta()?.description}
          </span>
        </label>
      </div>

      {/* Payload */}
      <div class="form-control">
        <label class="label">
          <span class="label-text">匹配内容</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full font-mono"
          placeholder={getPlaceholder()}
          value={props.rule.payload}
          onInput={(e) => props.onChange({ payload: e.currentTarget.value })}
        />
        <label class="label">
          <span class="label-text-alt text-base-content/50">
            示例: {meta()?.example}
          </span>
        </label>
      </div>

      {/* Proxy */}
      <div class="form-control">
        <label class="label">
          <span class="label-text">目标策略</span>
        </label>
        <select
          class="select select-bordered w-full"
          value={props.rule.proxy}
          onChange={(e) => props.onChange({ proxy: e.currentTarget.value })}
        >
          <For each={props.proxies}>
            {(proxy) => <option value={proxy}>{proxy}</option>}
          </For>
        </select>
      </div>

      {/* No Resolve option */}
      <Show when={['IP-CIDR', 'IP-CIDR6', 'IP-SUFFIX'].includes(props.rule.type)}>
        <div class="form-control md:col-span-3">
          <label class="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={props.rule.noResolve}
              onChange={(e) => props.onChange({ noResolve: e.currentTarget.checked })}
            />
            <span class="label-text">no-resolve (不解析域名)</span>
          </label>
        </div>
      </Show>

      {/* Enabled */}
      <div class="form-control md:col-span-3">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={props.rule.enabled !== false}
            onChange={(e) => props.onChange({ enabled: e.currentTarget.checked })}
          />
          <span class="label-text">启用此规则</span>
        </label>
      </div>
    </div>
  );
}
