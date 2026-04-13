// ==========================================
// WizardStep1 - Welcome Screen
// ==========================================

import { Rocket, Zap, Shield, Sparkles } from "lucide-solid";

interface WizardStep1Props {
  onNext: () => void;
}

export default function WizardStep1(props: WizardStep1Props) {
  return (
    <div class="text-center">
      {/* Logo and title */}
      <div class="mb-8">
        <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles class="w-12 h-12 text-white" />
        </div>
        <h1 class="text-3xl font-bold mb-2">
          欢迎使用 <span class="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Hyperion</span>
        </h1>
        <p class="text-base-content/70 text-lg">
          新一代 Clash 内核管理前端
        </p>
      </div>

      {/* Features */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="card bg-base-200/50 border border-base-300/50">
          <div class="card-body py-4 px-5 items-center text-center">
            <Zap class="w-8 h-8 text-cyan-400 mb-2" />
            <h3 class="font-semibold">极速响应</h3>
            <p class="text-sm text-base-content/60">SolidJS 驱动，毫秒级渲染</p>
          </div>
        </div>
        <div class="card bg-base-200/50 border border-base-300/50">
          <div class="card-body py-4 px-5 items-center text-center">
            <Shield class="w-8 h-8 text-purple-400 mb-2" />
            <h3 class="font-semibold">安全可靠</h3>
            <p class="text-sm text-base-content/60">本地运行，数据不上传</p>
          </div>
        </div>
        <div class="card bg-base-200/50 border border-base-300/50">
          <div class="card-body py-4 px-5 items-center text-center">
            <Rocket class="w-8 h-8 text-pink-400 mb-2" />
            <h3 class="font-semibold">开箱即用</h3>
            <p class="text-sm text-base-content/60">傻瓜式配置，快速上手</p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <button
        class="btn btn-primary btn-lg gap-2"
        onClick={props.onNext}
      >
        <Rocket class="w-5 h-5" />
        开始配置
      </button>
    </div>
  );
}
