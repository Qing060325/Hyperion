// ==========================================
// WizardStep4 - Complete
// ==========================================

import { CheckCircle2, PartyPopper, ArrowRight } from "lucide-solid";

interface WizardStep4Props {
  onComplete: () => void;
}

export default function WizardStep4(props: WizardStep4Props) {
  return (
    <div class="text-center">
      <div class="mb-8">
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <CheckCircle2 class="w-12 h-12 text-white" />
        </div>
        <h2 class="text-3xl font-bold mb-2">配置完成！</h2>
        <p class="text-base-content/70 text-lg">
          Hyperion 已准备就绪
        </p>
      </div>

      {/* Quick tips */}
      <div class="card bg-base-200/50 border border-base-300/50 mb-8">
        <div class="card-body text-left">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <PartyPopper class="w-5 h-5 text-primary" />
            快速上手提示
          </h3>
          <ul class="space-y-2 text-sm text-base-content/70">
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              点击左侧导航切换不同功能页面
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              在代理页面选择和测试代理节点
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              仪表盘可查看实时流量和连接数
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              设置页面可自定义主题和快捷键
            </li>
          </ul>
        </div>
      </div>

      {/* Complete button */}
      <button
        class="btn btn-primary btn-lg gap-2"
        onClick={props.onComplete}
      >
        开始使用
        <ArrowRight class="w-5 h-5" />
      </button>
    </div>
  );
}
