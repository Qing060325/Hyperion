/**
 * 向导进度管理工具
 * 支持暂停和恢复向导
 */

import { LocalStorageCache } from './cache';

const WIZARD_PROGRESS_KEY = 'hyperion-wizard-progress';

export interface WizardProgress {
  currentStep: string;
  completedSteps: string[];
  timestamp: number;
  data?: Record<string, any>;
}

export class WizardProgressManager {
  static save(progress: WizardProgress): void {
    LocalStorageCache.set(WIZARD_PROGRESS_KEY, {
      ...progress,
      timestamp: Date.now(),
    });
  }

  static load(): WizardProgress | null {
    return LocalStorageCache.get<WizardProgress>(WIZARD_PROGRESS_KEY);
  }

  static clear(): void {
    LocalStorageCache.remove(WIZARD_PROGRESS_KEY);
  }

  static isExpired(progress: WizardProgress, maxAge: number = 7 * 24 * 60 * 60 * 1000): boolean {
    return Date.now() - progress.timestamp > maxAge;
  }

  static markStepCompleted(step: string): void {
    const progress = this.load() || {
      currentStep: 'welcome',
      completedSteps: [],
      timestamp: Date.now(),
    };

    if (!progress.completedSteps.includes(step)) {
      progress.completedSteps.push(step);
    }

    this.save(progress);
  }

  static getNextStep(currentStep: string): string | null {
    const steps = ['welcome', 'detect', 'configure', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex === -1 || currentIndex === steps.length - 1) {
      return null;
    }

    return steps[currentIndex + 1];
  }
}
