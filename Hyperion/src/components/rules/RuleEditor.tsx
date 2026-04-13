// ==========================================
// RuleEditor - Main Rule Editor Component
// ==========================================

import { createSignal, For, Show, createMemo } from "solid-js";
import { Plus, Save, Undo, Download, Upload, Search, Filter, GripVertical, Trash2, Edit3, Copy } from "lucide-solid";
import type { RuleFormData, RuleType } from "../../types/rule-editor";
import { RULE_TYPES, getRuleTypeMeta } from "../../types/rule-editor";
import RuleForm from "./RuleForm";
import RulePreview from "./RulePreview";

interface RuleEditorProps {
  rules: RuleFormData[];
  proxies: string[];
  onSave: (rules: RuleFormData[]) => void;
  onCancel: () => void;
}

export default function RuleEditor(props: RuleEditorProps) {
  const [rules, setRules] = createSignal<RuleFormData[]>(props.rules);
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filterType, setFilterType] = createSignal<RuleType | 'all'>('all');
  const [modified, setModified] = createSignal(false);
  const [showPreview, setShowPreview] = createSignal(false);

  const filteredRules = createMemo(() => {
    const query = searchQuery().toLowerCase();
    const type = filterType();
    
    return rules().filter(rule => {
      if (type !== 'all' && rule.type !== type) return false;
      if (query && !rule.payload.toLowerCase().includes(query) && !rule.proxy.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  const addRule = () => {
    const newRule: RuleFormData = {
      id: `rule-${Date.now()}`,
      type: 'DOMAIN',
      payload: '',
      proxy: props.proxies[0] || 'DIRECT',
      enabled: true,
    };
    setRules([...rules(), newRule]);
    setSelectedIndex(rules().length - 1);
    setModified(true);
  };

  const updateRule = (index: number, updates: Partial<RuleFormData>) => {
    const newRules = [...rules()];
    newRules[index] = { ...newRules[index], ...updates };
    setRules(newRules);
    setModified(true);
  };

  const deleteRule = (index: number) => {
    const newRules = rules().filter((_, i) => i !== index);
    setRules(newRules);
    if (selectedIndex() === index) {
      setSelectedIndex(null);
    }
    setModified(true);
  };

  const duplicateRule = (index: number) => {
    const rule = rules()[index];
    const newRule: RuleFormData = {
      ...rule,
      id: `rule-${Date.now()}`,
      payload: rule.payload,
    };
    const newRules = [...rules()];
    newRules.splice(index + 1, 0, newRule);
    setRules(newRules);
    setModified(true);
  };

  const handleSave = () => {
    props.onSave(rules());
    setModified(false);
  };

  const handleUndo = () => {
    setRules(props.rules);
    setSelectedIndex(null);
    setModified(false);
  };

  const moveRule = (from: number, to: number) => {
    if (to < 0 || to >= rules().length) return;
    const newRules = [...rules()];
    const [removed] = newRules.splice(from, 1);
    newRules.splice(to, 0, removed);
    setRules(newRules);
    setModified(true);
  };

  return (
    <div class="h-full flex flex-col">
      {/* Toolbar */}
      <div class="flex items-center gap-2 mb-4 pb-4 border-b border-base-300">
        <button class="btn btn-primary btn-sm gap-1" onClick={addRule}>
          <Plus class="w-4 h-4" />
          添加规则
        </button>
        
        <div class="divider divider-horizontal mx-1"></div>
        
        <button 
          class="btn btn-success btn-sm gap-1" 
          onClick={handleSave}
          disabled={!modified()}
        >
          <Save class="w-4 h-4" />
          保存
        </button>
        
        <button 
          class="btn btn-ghost btn-sm gap-1" 
          onClick={handleUndo}
          disabled={!modified()}
        >
          <Undo class="w-4 h-4" />
          撤销
        </button>
        
        <div class="flex-1"></div>
        
        <button class="btn btn-ghost btn-sm gap-1" onClick={() => setShowPreview(!showPreview())}>
          <Download class="w-4 h-4" />
          预览
        </button>
      </div>

      {/* Search and filter */}
      <div class="flex gap-2 mb-4">
        <div class="flex-1 relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            class="input input-bordered w-full pl-10"
            placeholder="搜索规则..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>
        <select
          class="select select-bordered"
          value={filterType()}
          onChange={(e) => setFilterType(e.currentTarget.value as RuleType | 'all')}
        >
          <option value="all">全部类型</option>
          <For each={Array.from(new Set(RULE_TYPES.map(r => r.category)))}>
            {(category) => (
              <optgroup label={category.toUpperCase()}>
                <For each={RULE_TYPES.filter(r => r.category === category)}>
                  {(type) => <option value={type.type}>{type.name}</option>}
                </For>
              </optgroup>
            )}
          </For>
        </select>
      </div>

      {/* Rules list */}
      <div class="flex-1 overflow-auto">
        <Show when={filteredRules().length === 0}>
          <div class="text-center py-12 text-base-content/50">
            暂无规则，点击上方按钮添加
          </div>
        </Show>
        
        <div class="space-y-2">
          <For each={filteredRules()}>
            {(rule, index) => {
              const actualIndex = () => rules().findIndex(r => r.id === rule.id);
              const meta = () => getRuleTypeMeta(rule.type);
              
              return (
                <div
                  classList={{
                    'card bg-base-200 border transition-all cursor-pointer': true,
                    'border-primary': selectedIndex() === actualIndex(),
                    'border-transparent': selectedIndex() !== actualIndex(),
                  }}
                  onClick={() => setSelectedIndex(actualIndex())}
                >
                  <div class="card-body p-3 flex-row items-center gap-3">
                    {/* Drag handle */}
                    <div class="cursor-grab text-base-content/30 hover:text-base-content/60">
                      <GripVertical class="w-4 h-4" />
                    </div>
                    
                    {/* Rule info */}
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="badge badge-sm">{meta()?.icon} {meta()?.name}</span>
                        <span class="text-xs text-base-content/50">
                          → {rule.proxy}
                        </span>
                      </div>
                      <code class="text-sm truncate block bg-base-300/50 px-2 py-1 rounded">
                        {rule.type},{rule.payload},{rule.proxy}
                      </code>
                    </div>
                    
                    {/* Actions */}
                    <div class="flex gap-1">
                      <button
                        class="btn btn-ghost btn-xs"
                        onClick={(e) => { e.stopPropagation(); duplicateRule(actualIndex()); }}
                      >
                        <Copy class="w-3 h-3" />
                      </button>
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        onClick={(e) => { e.stopPropagation(); deleteRule(actualIndex()); }}
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* Edit panel */}
      <Show when={selectedIndex() !== null}>
        <div class="mt-4 pt-4 border-t border-base-300">
          <h4 class="font-semibold mb-3 flex items-center gap-2">
            <Edit3 class="w-4 h-4" />
            编辑规则 #{selectedIndex()! + 1}
          </h4>
          <RuleForm
            rule={rules()[selectedIndex()!]}
            proxies={props.proxies}
            onChange={(updates) => updateRule(selectedIndex()!, updates)}
          />
        </div>
      </Show>

      {/* Preview modal */}
      <Show when={showPreview()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
          <div class="card bg-base-100 shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div class="card-body">
              <RulePreview rules={rules()} onClose={() => setShowPreview(false)} />
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
