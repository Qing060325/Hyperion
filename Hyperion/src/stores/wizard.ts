// ==========================================
// Wizard State Store
// ==========================================

import { createSignal } from "solid-js";
import type { ClashDetectionResult, ClashConnectionConfig } from "../types/clash";

export type WizardStep = 'welcome' | 'detect' | 'configure' | 'complete';

export interface WizardState {
  currentStep: WizardStep;
  detectionResult: ClashDetectionResult | null;
  connectionConfig: ClashConnectionConfig;
  error: string | null;
  loading: boolean;
}

const DEFAULT_CONFIG: ClashConnectionConfig = {
  host: '127.0.0.1',
  port: 9090,
  secret: '',
};

export function createWizardStore() {
  const [state, setState] = createSignal<WizardState>({
    currentStep: 'welcome',
    detectionResult: null,
    connectionConfig: { ...DEFAULT_CONFIG },
    error: null,
    loading: false,
  });

  const setStep = (step: WizardStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  };

  const nextStep = () => {
    const steps: WizardStep[] = ['welcome', 'detect', 'configure', 'complete'];
    const currentIndex = steps.indexOf(state().currentStep);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['welcome', 'detect', 'configure', 'complete'];
    const currentIndex = steps.indexOf(state().currentStep);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const setDetectionResult = (result: ClashDetectionResult | null) => {
    setState(prev => ({ ...prev, detectionResult: result }));
  };

  const setConnectionConfig = (config: Partial<ClashConnectionConfig>) => {
    setState(prev => ({
      ...prev,
      connectionConfig: { ...prev.connectionConfig, ...config },
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const reset = () => {
    setState({
      currentStep: 'welcome',
      detectionResult: null,
      connectionConfig: { ...DEFAULT_CONFIG },
      error: null,
      loading: false,
    });
  };

  return {
    state,
    setStep,
    nextStep,
    prevStep,
    setDetectionResult,
    setConnectionConfig,
    setError,
    setLoading,
    reset,
  };
}

let _wizardStore: ReturnType<typeof createWizardStore> | null = null;

export function useWizardStore() {
  if (!_wizardStore) {
    _wizardStore = createWizardStore();
  }
  return _wizardStore;
}
