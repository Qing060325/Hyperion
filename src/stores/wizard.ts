// ==========================================
// Wizard State Store
// ==========================================

import { createSignal } from "solid-js";
import type { ClashDetectionResult, ClashConnectionConfig } from "../types/clash";
import { getCache, setCache } from "../utils/cache";

export type WizardStep = 'welcome' | 'detect' | 'configure' | 'complete';

export interface WizardState {
  currentStep: WizardStep;
  isPaused: boolean;
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

const CACHE_KEY = 'hyperion_wizard_state';

export function createWizardStore() {
  const cachedState = getCache<WizardState>(CACHE_KEY);
  
  const [state, setState] = createSignal<WizardState>({
    currentStep: 'welcome',
    isPaused: cachedState?.isPaused ?? false,
    detectionResult: cachedState?.detectionResult ?? null,
    connectionConfig: cachedState?.connectionConfig ?? { ...DEFAULT_CONFIG },
    error: null,
    loading: false,
  });

  const setStep = (step: WizardStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  };

  const jumpToStep = (step: WizardStep) => {
    const steps: WizardStep[] = ['welcome', 'detect', 'configure', 'complete'];
    const targetIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(state().currentStep);
    if (targetIndex >= 0 && targetIndex <= steps.length - 1) {
      setStep(step);
    }
  };

  const canJumpToStep = (step: WizardStep): boolean => {
    const steps: WizardStep[] = ['welcome', 'detect', 'configure', 'complete'];
    const currentIndex = steps.indexOf(state().currentStep);
    const targetIndex = steps.indexOf(step);
    return targetIndex <= currentIndex;
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

  const pause = () => {
    const currentState = state();
    setCache(CACHE_KEY, currentState);
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const resume = () => {
    const cached = getCache<WizardState>(CACHE_KEY);
    if (cached) {
      setState({
        ...cached,
        isPaused: false,
      });
    } else {
      setState(prev => ({ ...prev, isPaused: false }));
    }
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
    jumpToStep,
    canJumpToStep,
    nextStep,
    prevStep,
    setDetectionResult,
    setConnectionConfig,
    setError,
    setLoading,
    pause,
    resume,
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
