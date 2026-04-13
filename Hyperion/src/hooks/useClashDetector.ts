// ==========================================
// useClashDetector Hook
// ==========================================

import { createSignal, createEffect, onMount } from "solid-js";
import { clashDetector, type ClashDetectionResult } from "../services/clash-detector";
import type { ClashConnectionConfig, ClashVersion } from "../types/clash";

export function useClashDetector() {
  const [detecting, setDetecting] = createSignal(false);
  const [result, setResult] = createSignal<ClashDetectionResult | null>(null);
  const [testing, setTesting] = createSignal(false);
  const [testResult, setTestResult] = createSignal<ClashVersion | null>(null);

  /**
   * Detect local Clash kernel
   */
  const detect = async () => {
    setDetecting(true);
    setResult(null);
    
    try {
      const detectionResult = await clashDetector.detectLocalClash();
      setResult(detectionResult);
      return detectionResult;
    } catch (error) {
      const errorResult: ClashDetectionResult = {
        found: false,
        error: error instanceof Error ? error.message : '检测失败',
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setDetecting(false);
    }
  };

  /**
   * Test connection to Clash API
   */
  const testConnection = async (config: ClashConnectionConfig) => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const version = await clashDetector.testConnection(config);
      setTestResult(version);
      return version;
    } catch (error) {
      setTestResult(null);
      return null;
    } finally {
      setTesting(false);
    }
  };

  /**
   * Validate connection config
   */
  const validate = (config: ClashConnectionConfig) => {
    return clashDetector.validateConfig(config);
  };

  /**
   * Get recommended config
   */
  const getRecommended = (): ClashConnectionConfig => {
    return clashDetector.getRecommendedConfig();
  };

  return {
    detecting,
    result,
    testing,
    testResult,
    detect,
    testConnection,
    validate,
    getRecommended,
  };
}
