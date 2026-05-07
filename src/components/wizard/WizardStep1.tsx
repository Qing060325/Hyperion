// ==========================================
// WizardStep1 - Welcome Screen
// ==========================================

import { createSignal } from "solid-js";
import { Rocket, Zap, Shield, Sparkles, Palette, Check } from "lucide-solid";
import { setCache, getCache } from "@/utils/cache";

const WIZARD_THEME_KEY = 'hyperion_wizard_theme';

interface ThemeOption {
  id: string;
  name: string;
  gradient: string;
  gradientText: string;
  colors: [string, string];
}

const themeOptions: ThemeOption[] = [
  { id: 'cyberpunk', name: '赛博朋克', gradient: 'from-cyan-500 to-purple-600', gradientText: 'from-cyan-400 to-purple-500', colors: ['#06b6d4', '#9333ea'] },
  { id: 'ocean', name: '海洋', gradient: 'from-blue-500 to-cyan-400', gradientText: 'from-blue-400 to-cyan-500', colors: ['#3b82f6', '#06b6d4'] },
  { id: 'sunset', name: '日落', gradient: 'from-orange-500 to-pink-500', gradientText: 'from-orange-400 to-pink-500', colors: ['#f97316', '#ec4899'] },
  { id: 'forest', name: '森林', gradient: 'from-green-500 to-emerald-600', gradientText: 'from-green-400 to-emerald-500', colors: ['#22c55e', '#059669'] },
  { id: 'royal', name: '皇家', gradient: 'from-violet-600 to-indigo-600', gradientText: 'from-violet-400 to-indigo-500', colors: ['#7c3aed', '#6366f1'] },
];

interface WizardStep1Props {
  onNext: () => void;
}

export default function WizardStep1(props: WizardStep1Props) {
  const [selectedTheme, setSelectedTheme] = createSignal(
    getCache<string>(WIZARD_THEME_KEY) || 'cyberpunk'
  );

  const handleThemeSelect = (theme: ThemeOption) => {
    setSelectedTheme(theme.id);
    setCache(WIZARD_THEME_KEY, theme.id);
  };

  const getCurrentTheme = () => themeOptions.find(t => t.id === selectedTheme()) || themeOptions[0];

  return (
    <div class="text-center">
      {/* Logo and title */}
      <div class="mb-6">
        <div class={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${getCurrentTheme().gradient} flex items-center justify-center shadow-lg`}>
          <Sparkles class="w-12 h-12 text-white" />
        </div>
        <h1 class="text-3xl font-bold mb-2">
          欢迎使用 <span class={`bg-gradient-to-r ${getCurrentTheme().gradientText} bg-clip-text text-transparent`}>Hyperion</span>
        </h1>
        <p class="text-base-content/70 text-lg">
          新一代 Clash 内核管理前端
        </p>
      </div>

      {/* Theme selector */}
      <div class="mb-6">
        <div class="flex items-center justify-center gap-2 mb-3">
          <Palette class="w-4 h-4 text-base-content/50" />
          <span class="text-sm text-base-content/60">选择主题颜色</span>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          {themeOptions.map(theme => (
            <button
              classList={{
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300': true,
                'ring-2 ring-offset-2 ring-primary scale-110': selectedTheme() === theme.id,
                'hover:scale-105': selectedTheme() !== theme.id,
              }}
              style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
              onClick={() => handleThemeSelect(theme)}
              title={theme.name}
            >
              {selectedTheme() === theme.id && <Check class="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card bg-base-200/50 border border-base-300/50">
          <div class="card-body py-4 px-5 items-center text-center">
            <Zap class="w-8 h-8" style={{ color: getCurrentTheme().colors[0] }} />
            <h3 class="font-semibold">极速响应</h3>
            <p class="text-sm text-base-content/60">SolidJS 驱动，毫秒级渲染</p>
          </div>
        </div>
        <div class="card bg-base-200/50 border border-base-300/50">
          <div class="card-body py-4 px-5 items-center text-center">
            <Shield class="w-8 h-8" style={{ color: getCurrentTheme().colors[1] }} />
            <h3 class="font-semibold">安全可靠</h3>
            <p class="text-sm text-base-content/60">本地运行，数据不上传</p>
          </div>
        </div>
        <div class="card bg-base-200/50 border border-base-300/50">
          <div class="card-body py-4 px-5 items-center text-center">
            <Rocket class="w-8 h-8" style={{ color: getCurrentTheme().colors[0] }} />
            <h3 class="font-semibold">开箱即用</h3>
            <p class="text-sm text-base-content/60">傻瓜式配置，快速上手</p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <button
        class={`btn btn-lg gap-2`}
        style={{ background: `linear-gradient(135deg, ${getCurrentTheme().colors[0]}, ${getCurrentTheme().colors[1]})` }}
        onClick={props.onNext}
      >
        <Rocket class="w-5 h-5" />
        开始配置
      </button>
    </div>
  );
}