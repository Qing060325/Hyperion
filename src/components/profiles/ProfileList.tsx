// ==========================================
// ProfileList - Profile List Component
// ==========================================

import { For, Show, createSignal } from "solid-js";
import { Plus, Upload, Link, MoreVertical, Check, Trash2, Edit3, Download, RefreshCw } from "lucide-solid";
import type { Profile } from "../../types/clash";
import ripple from "@/components/ui/RippleEffect";

interface ProfileListProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onUpdate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onImport: () => void;
  onImportUrl: () => void;
}

export default function ProfileList(props: ProfileListProps) {
  const [menuOpen, setMenuOpen] = createSignal<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Actions */}
      <div class="flex gap-2 mb-4">
        <button use:ripple class="btn btn-primary btn-sm gap-1" onClick={props.onImport}>
          <Plus class="w-4 h-4" />
          添加本地配置
        </button>
        <button use:ripple class="btn btn-outline btn-sm gap-1" onClick={props.onImportUrl}>
          <Link class="w-4 h-4" />
          从 URL 导入
        </button>
      </div>

      {/* Profile list */}
      <div class="space-y-2">
        <For each={props.profiles}>
          {(profile) => {
            const isActive = () => props.activeProfileId === profile.id;
            
            return (
              <div
                classList={{
                  'card bg-base-200 border cursor-pointer transition-all animate-card-spring': true,
                  'border-primary ring-1 ring-primary/20': isActive(),
                  'border-base-300 hover:border-primary/50': !isActive(),
                }}
                onClick={() => props.onSelect(profile.id)}
              >
                <div class="card-body p-3 flex-row items-center gap-3">
                  {/* Active indicator */}
                  <Show when={isActive()}>
                    <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check class="w-4 h-4 text-primary-content" />
                    </div>
                  </Show>

                  <Show when={!isActive()}>
                    <div class="w-6 h-6 rounded-full bg-base-300" />
                  </Show>

                  {/* Info */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium truncate">{profile.name}</span>
                      <Show when={profile.type === 'remote'}>
                        <span class="badge badge-xs badge-info">远程</span>
                      </Show>
                    </div>
                    <div class="text-xs text-base-content/50 flex gap-3">
                      <span>{formatSize(profile.size)}</span>
                      <span>{formatDate(profile.lastModified)}</span>
                    </div>
                  </div>

                  {/* Menu */}
                  <div class="dropdown dropdown-end">
                    <label
                      tabindex="0"
                      class="btn btn-ghost btn-xs btn-circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen() === profile.id ? null : profile.id);
                      }}
                    >
                      <MoreVertical class="w-4 h-4" />
                    </label>
                    <Show when={menuOpen() === profile.id}>
                      <ul
                        tabindex="0"
                        class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-40 border border-base-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <li>
                          <a onClick={() => { props.onRename(profile.id, profile.name); setMenuOpen(null); }}>
                            <Edit3 class="w-4 h-4" />
                            重命名
                          </a>
                        </li>
                        <li>
                          <a onClick={() => { props.onExport(profile.id); setMenuOpen(null); }}>
                            <Download class="w-4 h-4" />
                            导出
                          </a>
                        </li>
                        <Show when={profile.type === 'remote'}>
                          <li>
                            <a onClick={() => { props.onUpdate(profile.id); setMenuOpen(null); }}>
                              <RefreshCw class="w-4 h-4" />
                              更新
                            </a>
                          </li>
                        </Show>
                        <Show when={!isActive()}>
                          <li class="text-error">
                            <a onClick={() => { props.onDelete(profile.id); setMenuOpen(null); }}>
                              <Trash2 class="w-4 h-4" />
                              删除
                            </a>
                          </li>
                        </Show>
                      </ul>
                    </Show>
                  </div>
                </div>
              </div>
            );
          }}
        </For>

        <Show when={props.profiles.length === 0}>
          <div class="text-center py-12 text-base-content/50">
            暂无配置文件，点击上方按钮添加
          </div>
        </Show>
      </div>
    </div>
  );
}
