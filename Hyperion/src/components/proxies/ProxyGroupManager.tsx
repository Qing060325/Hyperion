// ==========================================
// ProxyGroupManager - Proxy Group Management
// ==========================================

import { For, Show, createSignal } from "solid-js";
import { Settings, ChevronDown, ChevronRight, Zap, Save, RotateCcw } from "lucide-solid";
import type { ProxyInfo } from "../../types/clash";
import DraggableProxyList from "./DraggableProxyList";

interface ProxyGroupManagerProps {
  groups: ProxyInfo[];
  onSelectProxy: (group: string, proxy: string) => void;
  onTestDelay: (name: string) => void;
  onReorder?: (group: string, proxies: ProxyInfo[]) => void;
}

export default function ProxyGroupManager(props: ProxyGroupManagerProps) {
  const [expandedGroups, setExpandedGroups] = createSignal<Set<string>>(new Set());
  const [sortMode, setSortMode] = createSignal(false);
  const [modifiedGroups, setModifiedGroups] = createSignal<Set<string>>(new Set());

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleReorder = (groupName: string, proxies: ProxyInfo[]) => {
    props.onReorder?.(groupName, proxies);
    setModifiedGroups(prev => new Set([...prev, groupName]));
  };

  const handleSave = (groupName: string) => {
    // Save logic would go here
    setModifiedGroups(prev => {
      const next = new Set(prev);
      next.delete(groupName);
      return next;
    });
  };

  return (
    <div class="space-y-2">
      <For each={props.groups}>
        {(group) => {
          const isExpanded = () => expandedGroups().has(group.name);
          const proxies = () => group.all?.map(name => ({ name, type: 'Unknown' } as ProxyInfo)) || [];
          const isModified = () => modifiedGroups().has(group.name);

          return (
            <div class="card bg-base-200 border border-base-300">
              {/* Group header */}
              <div
                class="card-body p-3 flex-row items-center gap-3 cursor-pointer"
                onClick={() => toggleGroup(group.name)}
              >
                {isExpanded() ? (
                  <ChevronDown class="w-4 h-4 text-base-content/50" />
                ) : (
                  <ChevronRight class="w-4 h-4 text-base-content/50" />
                )}

                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{group.name}</span>
                    <span class="badge badge-sm badge-outline">{group.type}</span>
                    {isModified() && (
                      <span class="badge badge-sm badge-warning">已修改</span>
                    )}
                  </div>
                  <div class="text-xs text-base-content/50">
                    {group.all?.length || 0} 个节点 • 当前: {group.now || '无'}
                  </div>
                </div>

                <Show when={sortMode() && isExpanded()}>
                  <button
                    class="btn btn-ghost btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(group.name);
                    }}
                  >
                    <Save class="w-3 h-3" />
                  </button>
                </Show>
              </div>

              {/* Proxy list */}
              <Show when={isExpanded()}>
                <div class="px-4 pb-3">
                  <DraggableProxyList
                    proxies={proxies()}
                    groupName={group.name}
                    onReorder={(p) => handleReorder(group.name, p)}
                    onSelect={(name) => props.onSelectProxy(group.name, name)}
                    onTestDelay={props.onTestDelay}
                    selectedProxy={group.now}
                    sortable={sortMode()}
                  />
                </div>
              </Show>
            </div>
          );
        }}
      </For>

      {/* Sort mode toggle */}
      <div class="flex justify-end gap-2 pt-2">
        <button
          class="btn btn-sm btn-ghost gap-1"
          onClick={() => setSortMode(!sortMode())}
        >
          <Settings class="w-4 h-4" />
          {sortMode() ? '完成排序' : '排序模式'}
        </button>
      </div>
    </div>
  );
}
