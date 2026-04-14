// ==========================================
// ThemeSelector - Theme Selection Component
// ==========================================

import { For, Show } from "solid-js";
import { Check, Palette, Moon, Sun, Monitor } from "lucide-solid";
import type { ThemeConfig } from "../../types/plugin";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

const BUILTIN_THEMES: ThemeConfig[] = [
  {
    id: 'dark',
    name: '深色',
    colors: {
      primary: '#06b6d4',
      secondary: '#8b5cf6',
      background: '#0a0e1a',
      surface: '#111827',
      text: '#f8fafc',
    },
    radius: 'lg',
  },
  {
    id: 'light',
    name: '浅色',
    colors: {
      primary: '#0ea5e9',
      secondary: '#a855f7',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
    },
    radius: 'lg',
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      primary: '#88c0d0',
      secondary: '#81a1c1',
      background: '#2e3440',
      surface: '#3b4252',
      text: '#eceff4',
    },
    radius: 'md',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      primary: '#bd93f9',
      secondary: '#ff79c6',
      background: '#282a36',
      surface: '#44475a',
      text: '#f8f8f2',
    },
    radius: 'md',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      background: '#1a1b26',
      surface: '#24283b',
      text: '#c0caf5',
    },
    radius: 'sm',
  },
];

export default function ThemeSelector(props: ThemeSelectorProps) {
  return (
    <div>
      <h3 class="font-semibold mb-4 flex items-center gap-2">
        <Palette class="w-5 h-5" />
        主题选择
      </h3>

      {/* System theme option */}
      <div class="mb-4">
        <button
          classList={{
            'btn btn-block justify-start h-auto py-3': true,
            'btn-primary': props.currentTheme === 'system',
            'btn-ghost': props.currentTheme !== 'system',
          }}
          onClick={() => props.onThemeChange('system')}
        >
          <div class="flex items-center gap-3">
            <Monitor class="w-5 h-5" />
            <div class="text-left">
              <div class="font-medium">跟随系统</div>
              <div class="text-xs opacity-70">自动切换深色/浅色主题</div>
            </div>
            <Show when={props.currentTheme === 'system'}>
              <Check class="w-4 h-4 ml-auto" />
            </Show>
          </div>
        </button>
      </div>

      {/* Theme presets */}
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <For each={BUILTIN_THEMES}>
          {(theme) => (
            <button
              classList={{
                'card bg-base-200 border cursor-pointer transition-all hover:border-primary/50': true,
                'border-primary ring-1 ring-primary/20': props.currentTheme === theme.id,
                'border-base-300': props.currentTheme !== theme.id,
              }}
              onClick={() => props.onThemeChange(theme.id)}
            >
              <div class="card-body p-3">
                {/* Color preview */}
                <div class="flex gap-1 mb-2">
                  <div
                    class="w-4 h-4 rounded"
                    style={{ 'background-color': theme.colors.primary }}
                  />
                  <div
                    class="w-4 h-4 rounded"
                    style={{ 'background-color': theme.colors.secondary }}
                  />
                  <div
                    class="w-4 h-4 rounded"
                    style={{ 'background-color': theme.colors.background }}
                  />
                  <div
                    class="w-4 h-4 rounded border border-base-300"
                    style={{ 'background-color': theme.colors.surface }}
                  />
                </div>

                {/* Name */}
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm">{theme.name}</span>
                  <Show when={props.currentTheme === theme.id}>
                    <Check class="w-4 h-4 text-primary" />
                  </Show>
                </div>
              </div>
            </button>
          )}
        </For>
      </div>

      {/* Quick actions */}
      <div class="flex gap-2 mt-4">
        <button
          classList={{
            'btn btn-sm flex-1': true,
            'btn-primary': props.currentTheme === 'dark',
            'btn-ghost': props.currentTheme !== 'dark',
          }}
          onClick={() => props.onThemeChange('dark')}
        >
          <Moon class="w-4 h-4" />
          深色
        </button>
        <button
          classList={{
            'btn btn-sm flex-1': true,
            'btn-primary': props.currentTheme === 'light',
            'btn-ghost': props.currentTheme !== 'light',
          }}
          onClick={() => props.onThemeChange('light')}
        >
          <Sun class="w-4 h-4" />
          浅色
        </button>
      </div>
    </div>
  );
}
