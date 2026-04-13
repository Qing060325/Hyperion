// ==========================================
// ProfileImporter - Import Config Modal
// ==========================================

import { createSignal, Show } from "solid-js";
import { X, Upload, Link, FileText, Loader2 } from "lucide-solid";
import type { Profile } from "../../types/clash";
import { profileManager } from "../../services/profile-manager";

interface ProfileImporterProps {
  type: 'local' | 'url';
  onImport: (profile: Profile) => void;
  onClose: () => void;
}

export default function ProfileImporter(props: ProfileImporterProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [url, setUrl] = createSignal('');
  const [name, setName] = createSignal('');
  const [dragOver, setDragOver] = createSignal(false);

  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(yaml|yml)$/i)) {
      setError('请选择 YAML 格式的配置文件');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await profileManager.importProfile(file);
      props.onImport(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!url().trim()) {
      setError('请输入配置 URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await profileManager.importFromUrl(url(), name() || undefined);
      props.onImport(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
      <div class="card bg-base-100 shadow-xl w-full max-w-md mx-4">
        <div class="card-body">
          {/* Header */}
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-lg flex items-center gap-2">
              {props.type === 'local' ? (
                <>
                  <Upload class="w-5 h-5" />
                  导入本地配置
                </>
              ) : (
                <>
                  <Link class="w-5 h-5" />
                  从 URL 导入
                </>
              )}
            </h3>
            <button class="btn btn-ghost btn-sm btn-circle" onClick={props.onClose}>
              <X class="w-4 h-4" />
            </button>
          </div>

          {/* Error */}
          <Show when={error()}>
            <div class="alert alert-error mb-4">
              <span>{error()}</span>
            </div>
          </Show>

          {/* Local file import */}
          <Show when={props.type === 'local'}>
            <div
              classList={{
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors': true,
                'border-primary bg-primary/5': dragOver(),
                'border-base-300': !dragOver(),
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileText class="w-12 h-12 mx-auto mb-3 text-base-content/50" />
              <p class="mb-3 text-base-content/70">拖拽配置文件到此处</p>
              <p class="text-sm text-base-content/50 mb-3">或</p>
              <label class="btn btn-primary">
                选择文件
                <input
                  type="file"
                  class="hidden"
                  accept=".yaml,.yml"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </label>
            </div>
          </Show>

          {/* URL import */}
          <Show when={props.type === 'url'}>
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">配置 URL</span>
                </label>
                <input
                  type="url"
                  class="input input-bordered w-full"
                  placeholder="https://example.com/config.yaml"
                  value={url()}
                  onInput={(e) => setUrl(e.currentTarget.value)}
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">名称 (可选)</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="我的配置"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                />
              </div>

              <button
                class="btn btn-primary btn-block"
                onClick={handleUrlImport}
                disabled={loading()}
              >
                {loading() ? (
                  <>
                    <Loader2 class="w-4 h-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  '导入'
                )}
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
