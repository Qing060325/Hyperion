/**
 * 全局类型定义
 */

declare global {
  interface Window {
    closeWizard?: () => void;
    resetWizard?: () => void;
    showWizard?: () => void;
    hyperion?: {
      version: string;
      closeWizard: () => void;
      resetWizard: () => void;
      showWizard: () => void;
    };
  }
}

export {};
