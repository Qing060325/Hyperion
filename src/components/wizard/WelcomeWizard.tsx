// ==========================================
// WelcomeWizard - Main Wizard Component
// ==========================================

import { createSignal, Show, Switch, Match, onMount, onCleanup } from "solid-js";
import { useWizardStore, type WizardStep } from "../../stores/wizard";
import WizardStep1 from "./WizardStep1";
import WizardStep2 from "./WizardStep2";
import WizardStep3 from "./WizardStep3";
import WizardStep4 from "./WizardStep4";
import { X, HelpCircle, Pause, Play } from "lucide-solid";
import ripple from "@/components/ui/RippleEffect";
import { logger, logEmoji } from "@/utils/logger";
import { getCache } from "@/utils/cache";

const WIZARD_THEME_KEY = 'hyperion_wizard_theme';

interface ThemeConfig {
  id: string;
  gradient: string;
  gradientText: string;
  colors: [string, string];
}

const themeConfigs: Record<string, ThemeConfig> = {
  cyberpunk: { id: 'cyberpunk', gradient: 'from-cyan-500 to-purple-600', gradientText: 'from-cyan-400 to-purple-500', colors: ['#06b6d4', '#9333ea'] },
  ocean: { id: 'ocean', gradient: 'from-blue-500 to-cyan-400', gradientText: 'from-blue-400 to-cyan-500', colors: ['#3b82f6', '#06b6d4'] },
  sunset: { id: 'sunset', gradient: 'from-orange-500 to-pink-500', gradientText: 'from-orange-400 to-pink-500', colors: ['#f97316', '#ec4899'] },
  forest: { id: 'forest', gradient: 'from-green-500 to-emerald-600', gradientText: 'from-green-400 to-emerald-500', colors: ['#22c55e', '#059669'] },
  royal: { id: 'royal', gradient: 'from-violet-600 to-indigo-600', gradientText: 'from-violet-400 to-indigo-500', colors: ['#7c3aed', '#6366f1'] },
};

interface WelcomeWizardProps {
  onComplete: () => void;
}

export default function WelcomeWizard(props: WelcomeWizardProps) {
  const wizard = useWizardStore();
  const [showCloseConfirm, setShowCloseConfirm] = createSignal(false);
  const [isClosing, setIsClosing] = createSignal(false);
  
  const getTheme = () => {
    const themeId = getCache<string>(WIZARD_THEME_KEY) || 'cyberpunk';
    return themeConfigs[themeId] || themeConfigs.cyberpunk;
  };
  
  const steps: { id: WizardStep; label: string; icon: string; num: string }[] = [
    { id: 'welcome', label: '欢迎', icon: '👋', num: '1' },
    { id: 'detect', label: '检测', icon: '🔍', num: '2' },
    { id: 'configure', label: '配置', icon: '⚙️', num: '3' },
    { id: 'complete', label: '完成', icon: '✅', num: '4' },
  ];

  const currentStepIndex = () => steps.findIndex(s => s.id === wizard.state().currentStep);

  const handleStepClick = (stepId: WizardStep) => {
    if (wizard.canJumpToStep(stepId)) {
      wizard.jumpToStep(stepId);
    }
  };

  const handleClose = () => {
    if (wizard.state().currentStep === 'complete') {
      handleComplete();
    } else {
      setShowCloseConfirm(true);
    }
  };

  const confirmClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleComplete();
    }, 300);
  };

  const handleComplete = () => {
    props.onComplete();
  };

  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        wizard.nextStep();
      } else if (e.key === 'ArrowLeft') {
        wizard.prevStep();
      } else if (e.key === 'p' || e.key === 'P') {
        if (wizard.state().isPaused) {
          wizard.resume();
        } else {
          wizard.pause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    logger.log(`${logEmoji.wizard} Welcome wizard opened`);
    
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      logger.log(`${logEmoji.wizard} Welcome wizard closed`);
    });
  });

  return (
    <>
      <div 
        class={`fixed inset-0 z-50 flex items-center justify-center bg-base-300/95 backdrop-blur-sm animate-modal-backdrop ${isClosing() ? 'animate-modal-backdrop-out' : ''}`}
      >
        <div class={`w-full max-w-2xl mx-4 animate-modal-content relative ${isClosing() ? 'animate-modal-content-out' : ''}`}>
          {/* Close button */}
          <button
            use:ripple
            class="absolute top-4 right-4 z-10 btn btn-ghost btn-sm btn-circle hover:btn-error transition-colors"
            onClick={handleClose}
            title="关闭向导 (Esc)"
          >
            <X size={20} />
          </button>

          {/* Help tooltip */}
          <div class="absolute top-4 left-4 z-10">
            <div class="tooltip tooltip-right" data-tip="按 ESC 关闭向导">
              <HelpCircle size={16} class="text-base-content/40" />
            </div>
          </div>

          {/* Pause/Resume button */}
          <Show when={wizard.state().currentStep !== 'complete'}>
            <button
              use:ripple
              class="absolute top-4 left-12 z-10 btn btn-ghost btn-sm btn-circle hover:btn-warning transition-colors"
              onClick={() => wizard.state().isPaused ? wizard.resume() : wizard.pause()}
              title={wizard.state().isPaused ? "继续 (P)" : "暂停 (P)"}
            >
              {wizard.state().isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </Show>

          {/* Progress indicator with progress bar - hidden when paused */}
          <Show when={!wizard.state().isPaused}>
            <div class="mb-8" role="progressbar" aria-valuenow={currentStepIndex() + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label="向导进度">
              {/* Progress bar */}
              <div class="mb-6">
                <div class="h-2 bg-base-300 rounded-full overflow-hidden">
                  <div 
                    class="h-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${((currentStepIndex() + 1) / steps.length) * 100}%`,
                      background: `linear-gradient(90deg, ${getTheme().colors[0]}, ${getTheme().colors[1]})`
                    }}
                    role="progressbar"
                    aria-valuenow={currentStepIndex() + 1}
                    aria-valuemin={1}
                    aria-valuemax={steps.length}
                  />
                </div>
              </div>
              
              {/* Step indicators with clickable navigation */}
              <div class="flex items-center justify-between relative" role="tablist" aria-label="向导步骤">
                {/* Connecting line */}
                <div class="absolute top-5 left-0 right-0 h-0.5 bg-base-300 -z-10" />
                <div 
                  class="absolute top-5 left-0 h-0.5 -z-10 transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(currentStepIndex() / (steps.length - 1)) * 100}%`,
                    background: `linear-gradient(90deg, ${getTheme().colors[0]}, ${getTheme().colors[1]})`
                  }}
                />
                
{steps.map((step, index) => {
                const canJump = wizard.canJumpToStep(step.id);
                const isCompleted = index < currentStepIndex();
                const isCurrent = index === currentStepIndex();
                const theme = getTheme();
                
                return (
                  <div class="flex flex-col items-center" role="tabpanel" aria-label={step.label}>
                    <button
                      ref={null}
                      disabled={!canJump && !isCurrent}
                      onClick={() => handleStepClick(step.id)}
                      classList={{
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 cursor-pointer': true,
                        'text-white cursor-default': isCurrent,
                        'text-white cursor-pointer hover:scale-110 hover:shadow-lg': isCompleted,
                        'bg-base-300 text-base-content/50 cursor-not-allowed opacity-50': !canJump && !isCurrent,
                      }}
                      style={isCurrent || isCompleted ? { 
                        background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
                        boxShadow: isCurrent ? `0 0 20px ${theme.colors[0]}40` : undefined
                      } : undefined}
                      title={canJump ? `跳转到: ${step.label}` : `需要完成前面的步骤`}
                      role="tab"
                      aria-selected={isCurrent}
                      aria-label={`步骤 ${step.num}: ${step.label}${isCompleted ? ' (已完成)' : isCurrent ? ' (当前)' : ''}`}
                      tabindex={isCurrent ? 0 : -1}
                    >
                      {isCompleted ? '✓' : step.num}
                    </button>
<span
                      classList={{
                        'mt-2 text-sm font-medium transition-colors': true,
                      }}
                      style={{ color: isCurrent ? getTheme().colors[0] : isCompleted ? getTheme().colors[1] : undefined }}
                    >
                      {step.label}
                    </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Show>

          {/* Wizard card - hidden when paused */}
          <Show when={!wizard.state().isPaused}>
            <div class="card bg-base-100 shadow-2xl border border-base-300/50">
              <div class="card-body p-8">
                <Switch fallback={<div>Unknown step</div>}>
                  <Match when={wizard.state().currentStep === 'welcome'}>
                    <WizardStep1 onNext={() => wizard.nextStep()} />
                  </Match>
                  <Match when={wizard.state().currentStep === 'detect'}>
                    <WizardStep2 
                      onNext={() => wizard.nextStep()} 
                      onPrev={() => wizard.prevStep()}
                      onSkip={() => wizard.setStep('configure')}
                    />
                  </Match>
                  <Match when={wizard.state().currentStep === 'configure'}>
                    <WizardStep3 
                      onNext={() => wizard.nextStep()} 
                      onPrev={() => wizard.prevStep()}
                    />
                  </Match>
                  <Match when={wizard.state().currentStep === 'complete'}>
                    <WizardStep4 onComplete={handleComplete} />
                  </Match>
                </Switch>
              </div>
            </div>
          </Show>

          {/* Paused overlay */}
          <Show when={wizard.state().isPaused}>
            <div class="card bg-base-100 shadow-2xl border border-warning/50">
              <div class="card-body p-8 text-center">
                <div class="mb-4">
                  <div class="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
                    <Pause class="w-8 h-8 text-warning" />
                  </div>
                </div>
                <h2 class="text-xl font-bold mb-2">向导已暂停</h2>
                <p class="text-base-content/70 mb-4">
                  您可以随时从设置页面恢复向导，或继续之前的进度。
                </p>
                <div class="flex justify-center gap-4">
                  <button
                    use:ripple
                    class="btn btn-primary"
                    onClick={() => wizard.resume()}
                  >
                    <Play size={16} />
                    继续
                  </button>
                  <button
                    use:ripple
                    class="btn btn-ghost"
                    onClick={handleClose}
                  >
                    退出
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Skip button - hidden when paused */}
          <Show when={!wizard.state().isPaused && wizard.state().currentStep !== 'complete'}>
            <div class="text-center mt-4">
              <button
                use:ripple
                class="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content"
                onClick={handleClose}
              >
                跳过向导
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Close confirmation modal */}
      <Show when={showCloseConfirm()}>
        <div class="modal modal-open animate-modal-backdrop">
          <div class="modal-box animate-modal-content">
            <h3 class="font-bold text-lg mb-4">确认关闭向导？</h3>
            <p class="py-4 text-base-content/70">
              您可以随时在设置页面重新启动向导。确定要跳过吗？
            </p>
            <div class="modal-action">
              <button 
                use:ripple
                class="btn btn-ghost" 
                onClick={() => setShowCloseConfirm(false)}
              >
                取消
              </button>
              <button 
                use:ripple
                class="btn btn-primary" 
                onClick={confirmClose}
              >
                确定跳过
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
