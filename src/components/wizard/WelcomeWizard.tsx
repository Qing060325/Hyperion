// ==========================================
// WelcomeWizard - Main Wizard Component
// ==========================================

import { createSignal, Show, Switch, Match, onMount } from "solid-js";
import { useWizardStore, type WizardStep } from "../../stores/wizard";
import WizardStep1 from "./WizardStep1";
import WizardStep2 from "./WizardStep2";
import WizardStep3 from "./WizardStep3";
import WizardStep4 from "./WizardStep4";
import { X } from "lucide-solid";
import ripple from "@/components/ui/RippleEffect";

interface WelcomeWizardProps {
  onComplete: () => void;
}

export default function WelcomeWizard(props: WelcomeWizardProps) {
  const wizard = useWizardStore();
  
  const steps: { id: WizardStep; label: string; icon: string }[] = [
    { id: 'welcome', label: '欢迎', icon: '👋' },
    { id: 'detect', label: '检测', icon: '🔍' },
    { id: 'configure', label: '配置', icon: '⚙️' },
    { id: 'complete', label: '完成', icon: '✅' },
  ];

  const currentStepIndex = () => steps.findIndex(s => s.id === wizard.state().currentStep);

  const handleComplete = () => {
    props.onComplete();
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/95 backdrop-blur-sm animate-modal-backdrop">
      <div class="w-full max-w-2xl mx-4 animate-modal-content">
        {/* Progress indicator */}
        <div class="mb-8">
          <div class="flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <div class="flex items-center">
                <div
                  classList={{
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300': true,
                    'bg-primary text-primary-content': index <= currentStepIndex(),
                    'bg-base-300 text-base-content/50': index > currentStepIndex(),
                  }}
                >
                  {index < currentStepIndex() ? '✓' : step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div
                    classList={{
                      'w-12 h-1 mx-1 rounded transition-all duration-300': true,
                      'bg-primary': index < currentStepIndex(),
                      'bg-base-300': index >= currentStepIndex(),
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div class="flex justify-center mt-4 gap-12">
            {steps.map((step, index) => (
              <span
                classList={{
                  'text-sm transition-colors': true,
                  'text-primary font-medium': index === currentStepIndex(),
                  'text-base-content/70': index !== currentStepIndex(),
                }}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Wizard card */}
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

        {/* Skip button */}
        <Show when={wizard.state().currentStep !== 'complete'}>
          <div class="text-center mt-4">
            <button
              use:ripple
              class="btn btn-ghost btn-sm text-base-content/50"
              onClick={handleComplete}
            >
              跳过向导
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}
