// ==========================================
// LogFilter - Advanced Log Filter
// ==========================================

import { For, Show, createSignal } from "solid-js";
import { Filter, Download, Trash2, Plus, X } from "lucide-solid";
import type { LogFilter as LogFilterType, LogLevel, LogPreset } from "../../types/log";
import { LOG_PRESETS } from "../../types/log";

interface LogFilterProps {
  filter: LogFilterType;
  onChange: (filter: LogFilterType) => void;
  onExport: (format: 'txt' | 'json' | 'csv') => void;
  onClear: () => void;
}

export default function LogFilterComponent(props: LogFilterProps) {
  const [showAdvanced, setShowAdvanced] = createSignal(false);
  const [newKeyword, setNewKeyword] = createSignal('');

  const levels: { id: LogLevel; label: string; color: string }[] = [
    { id: 'debug', label: 'Debug', color: 'badge-neutral' },
    { id: 'info', label: 'Info', color: 'badge-info' },
    { id: 'warning', label: 'Warning', color: 'badge-warning' },
    { id: 'error', label: 'Error', color: 'badge-error' },
  ];

  const toggleLevel = (level: LogLevel) => {
    const current = props.filter.level;
    const newLevels = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    props.onChange({ ...props.filter, level: newLevels as LogLevel[] });
  };

  const addKeyword = () => {
    const kw = newKeyword().trim();
    if (kw && !props.filter.keywords.includes(kw)) {
      props.onChange({ ...props.filter, keywords: [...props.filter.keywords, kw] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    props.onChange({ ...props.filter, keywords: props.filter.keywords.filter(k => k !== kw) });
  };

  const applyPreset = (preset: LogPreset) => {
    props.onChange({ ...props.filter, ...preset.filter });
  };

  return (
    <div class="space-y-3">
      {/* Presets */}
      <div class="flex flex-wrap gap-2">
        <For each={LOG_PRESETS}>
          {(preset) => (
            <button
              class="btn btn-sm btn-ghost"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </button>
          )}
        </For>
      </div>

      {/* Level filters */}
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-base-content/50">级别:</span>
        <For each={levels}>
          {(level) => (
            <button
              classList={{
                'badge cursor-pointer transition-all': true,
                [level.color]: props.filter.level.includes(level.id),
                'badge-outline': !props.filter.level.includes(level.id),
              }}
              onClick={() => toggleLevel(level.id)}
            >
              {level.label}
            </button>
          )}
        </For>
      </div>

      {/* Keywords */}
      <div class="space-y-2">
        <div class="flex gap-2">
          <input
            type="text"
            class="input input-sm input-bordered flex-1"
            placeholder="添加关键词过滤..."
            value={newKeyword()}
            onInput={(e) => setNewKeyword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
          />
          <button class="btn btn-sm btn-ghost" onClick={addKeyword}>
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <Show when={props.filter.keywords.length > 0}>
          <div class="flex flex-wrap gap-1">
            <For each={props.filter.keywords}>
              {(kw) => (
                <span class="badge badge-primary gap-1">
                  {kw}
                  <button onClick={() => removeKeyword(kw)}>
                    <X class="w-3 h-3" />
                  </button>
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Advanced toggle */}
      <button
        class="btn btn-ghost btn-sm gap-1"
        onClick={() => setShowAdvanced(!showAdvanced())}
      >
        <Filter class="w-4 h-4" />
        {showAdvanced() ? '收起' : '高级过滤'}
      </button>

      {/* Advanced filters */}
      <Show when={showAdvanced()}>
        <div class="card bg-base-200 p-3 space-y-3">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-sm">进程名</span>
            </label>
            <input
              type="text"
              class="input input-sm input-bordered"
              placeholder="例如: chrome"
              value={props.filter.process || ''}
              onInput={(e) => props.onChange({ ...props.filter, process: e.currentTarget.value || undefined })}
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-sm">排除关键词</span>
            </label>
            <input
              type="text"
              class="input input-sm input-bordered"
              placeholder="用逗号分隔"
              value={props.filter.excludeKeywords.join(',')}
              onInput={(e) => props.onChange({
                ...props.filter,
                excludeKeywords: e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
          </div>
        </div>
      </Show>

      {/* Actions */}
      <div class="flex gap-2">
        <div class="dropdown dropdown-top">
          <label tabindex="0" class="btn btn-sm btn-ghost gap-1">
            <Download class="w-4 h-4" />
            导出
          </label>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-32 border border-base-300">
            <li><a onClick={() => props.onExport('txt')}>TXT 格式</a></li>
            <li><a onClick={() => props.onExport('json')}>JSON 格式</a></li>
            <li><a onClick={() => props.onExport('csv')}>CSV 格式</a></li>
          </ul>
        </div>

        <button class="btn btn-sm btn-ghost text-error gap-1" onClick={props.onClear}>
          <Trash2 class="w-4 h-4" />
          清空日志
        </button>
      </div>
    </div>
  );
}
