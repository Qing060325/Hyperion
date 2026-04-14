// ==========================================
// WizardStep2 - Detect Clash Kernel
// ==========================================

import { createSignal, onMount, Show } from "solid-js";
import { Search, Check, AlertCircle, Loader2, SkipForward } from "lucide-solid";
import { useWizardStore } from "../../stores/wizard";
import { useClashDetector } from "../../hooks/useClashDetector";

interface WizardStep2Props {
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export default function WizardStep2(props: WizardStep2Props) {
  const wizard = useWizardStore();
  const detector = useClashDetector();

  onMount(() => {
    handleDetect();
  });

  const handleDetect = async () => {
    wizard.setLoading(true);
    wizard.setError(null);
    
    try {
      const result = await detector.detect();
      wizard.setDetectionResult(result);
      
      if (result.found && result.version) {
        wizard.setConnectionConfig({
          host: '127.0.0.1',
          port: parseInt(result.path?.split(':')[1] || '9090'),
        });
      }
    } catch (error) {
      wizard.setError(error instanceof Error ? error.message : '检测失败');
    } finally {
      wizard.setLoading(false);
    }
  };

  return (
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-2">检测 Clash 内核</h2>
      <p class="text-base-content/70 mb-8">
        自动检测本地运行中的 Clash 内核
      </p>

      <Show when={wizard.state().loading}>
        <div class="flex flex-col items-center gap-4 py-8">
          <Loader2 class="w-16 h-16 text-primary animate-spin" />
          <p class="text-base-content/70">正在检测 Clash 内核...</p>
        </div>
      </Show>

      <Show when={!wizard.state().loading && wizard.state().detectionResult}>
        <div class="py-4">
          <Show when={wizard.state().detectionResult?.found}>
            <div class="alert alert-success mb-6">
              <Check class="w-6 h-6" />
              <div class="text-left">
                <h3 class="font-bold">检测到 Clash 内核</h3>
                <div class="text-sm opacity-80">
                  <p>版本: {wizard.state().detectionResult?.version}</p>
                  <p>类型: {wizard.state().detectionResult?.meta ? 'Clash Meta' : 'Clash Premium'}</p>
                  <p>地址: {wizard.state().detectionResult?.path}</p>
                </div>
              </div>
            </div>
            <div class="flex gap-3 justify-center">
              <button class="btn btn-outline" onClick={props.onPrev}>
                上一步
              </button>
              <button class="btn btn-primary" onClick={props.onNext}>
                下一步
              </button>
            </div>
          </Show>

          <Show when={!wizard.state().detectionResult?.found}>
            <div class="alert alert-warning mb-6">
              <AlertCircle class="w-6 h-6" />
              <div class="text-left">
                <h3 class="font-bold">未检测到 Clash 内核</h3>
                <div class="text-sm opacity-80">
                  {wizard.state().detectionResult?.error || '请确保 Clash 内核正在运行'}
                </div>
              </div>
            </div>
            <div class="flex gap-3 justify-center">
              <button class="btn btn-ghost" onClick={props.onSkip}>
                <SkipForward class="w-4 h-4" />
                手动配置
              </button>
              <button class="btn btn-outline" onClick={handleDetect}>
                <Search class="w-4 h-4" />
                重新检测
              </button>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!wizard.state().loading && !wizard.state().detectionResult}>
        <div class="py-8">
          <button class="btn btn-primary btn-lg" onClick={handleDetect}>
            <Search class="w-5 h-5" />
            开始检测
          </button>
        </div>
      </Show>
    </div>
  );
}
