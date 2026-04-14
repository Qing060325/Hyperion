// ==========================================
// Profiles Page - Multi-config Management
// ==========================================

import { createSignal, onMount, Show } from "solid-js";
import { FolderOpen, RefreshCw } from "lucide-solid";
import ProfileList from "../components/profiles/ProfileList";
import ProfileImporter from "../components/profiles/ProfileImporter";
import type { Profile } from "../types/clash";
import { profileManager } from "../services/profile-manager";
import { clashApi } from "../services/clash-api";
import ripple from "@/components/ui/RippleEffect";

export default function Profiles() {
  const [profiles, setProfiles] = createSignal<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [showImporter, setShowImporter] = createSignal(false);
  const [importType, setImportType] = createSignal<'local' | 'url'>('local');

  onMount(() => {
    profileManager.loadFromStorage();
    setProfiles(profileManager.getProfiles());
    setActiveProfileId(profileManager.getActiveProfile()?.id || null);
  });

  const handleSelect = async (id: string) => {
    setLoading(true);
    try {
      await profileManager.switchProfile(id);
      setActiveProfileId(id);
      setProfiles(profileManager.getProfiles());
      // Reload Clash config
      await clashApi.getConfig();
    } catch (error) {
      console.error('Failed to switch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) return;
    
    try {
      await profileManager.deleteProfile(id);
      setProfiles(profileManager.getProfiles());
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const blob = await profileManager.exportProfile(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profiles().find(p => p.id === id)?.name || 'config'}.yaml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export profile:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      await profileManager.updateRemoteProfile(id);
      setProfiles(profileManager.getProfiles());
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = (id: string, currentName: string) => {
    const newName = prompt('输入新名称:', currentName);
    if (newName && newName !== currentName) {
      profileManager.renameProfile(id, newName);
      setProfiles(profileManager.getProfiles());
    }
  };

  const handleImport = async (profile: Profile) => {
    profileManager.addProfile(profile);
    setProfiles(profileManager.getProfiles());
    setShowImporter(false);
  };

  return (
    <div class="animate-page-in-enhanced space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <FolderOpen class="w-6 h-6" />
            配置文件管理
          </h1>
          <p class="text-base-content/50 text-sm mt-1">
            管理多个 Clash 配置文件
          </p>
        </div>
        <button use:ripple class="btn btn-ghost btn-sm gap-1" onClick={() => {
          profileManager.loadFromStorage();
          setProfiles(profileManager.getProfiles());
        }}>
          <RefreshCw class="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* Profile list */}
      <ProfileList
        profiles={profiles()}
        activeProfileId={activeProfileId()}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onExport={handleExport}
        onUpdate={handleUpdate}
        onRename={handleRename}
        onImport={() => {
          setImportType('local');
          setShowImporter(true);
        }}
        onImportUrl={() => {
          setImportType('url');
          setShowImporter(true);
        }}
      />

      {/* Import modal */}
      <Show when={showImporter()}>
        <ProfileImporter
          type={importType()}
          onImport={handleImport}
          onClose={() => setShowImporter(false)}
        />
      </Show>

      {/* Loading overlay */}
      <Show when={loading()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/50">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </Show>
    </div>
  );
}
