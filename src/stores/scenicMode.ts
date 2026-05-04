import { createStore } from "solid-js/store";

export interface ScenicSwitchDecision {
  shouldSwitch: boolean;
  nodeId: string | null;
  reason: "stable" | "frozen" | "min_display" | "insufficient_stability" | "same_node" | "empty_node";
}

interface ObserveOptions {
  critical?: boolean;
  timestamp?: number;
}

const DEFAULT_STABLE_MS = 4000;
const DEFAULT_MIN_DISPLAY_MS = 25000;

function createScenicModeStore() {
  const [state, setState] = createStore({
    frozen: false,
    currentBackgroundNodeId: null as string | null,
    lastSwitchAt: 0,
    lastSwitchNodeId: null as string | null,
    candidateNodeId: null as string | null,
    candidateSince: 0,
    stableWindowMs: DEFAULT_STABLE_MS,
    minDisplayMs: DEFAULT_MIN_DISPLAY_MS,
  });

  const setFrozen = (frozen: boolean) => setState("frozen", frozen);

  const configure = (options: { stableWindowMs?: number; minDisplayMs?: number }) => {
    if (typeof options.stableWindowMs === "number" && options.stableWindowMs > 0) {
      setState("stableWindowMs", options.stableWindowMs);
    }
    if (typeof options.minDisplayMs === "number" && options.minDisplayMs > 0) {
      setState("minDisplayMs", options.minDisplayMs);
    }
  };

  const observeNode = (nodeId: string | null | undefined, options: ObserveOptions = {}): ScenicSwitchDecision => {
    const now = options.timestamp ?? Date.now();
    const candidate = nodeId?.trim() || null;
    const critical = options.critical === true;

    if (!candidate) {
      return { shouldSwitch: false, nodeId: null, reason: "empty_node" };
    }

    if (state.frozen) {
      return { shouldSwitch: false, nodeId: candidate, reason: "frozen" };
    }

    if (state.currentBackgroundNodeId === candidate) {
      setState("candidateNodeId", candidate);
      setState("candidateSince", now);
      return { shouldSwitch: false, nodeId: candidate, reason: "same_node" };
    }

    if (state.candidateNodeId !== candidate) {
      setState("candidateNodeId", candidate);
      setState("candidateSince", now);
      return { shouldSwitch: false, nodeId: candidate, reason: "insufficient_stability" };
    }

    const stableFor = now - state.candidateSince;
    if (stableFor < state.stableWindowMs) {
      return { shouldSwitch: false, nodeId: candidate, reason: "insufficient_stability" };
    }

    const elapsedSinceLastSwitch = now - state.lastSwitchAt;
    if (!critical && state.lastSwitchAt > 0 && elapsedSinceLastSwitch < state.minDisplayMs) {
      return { shouldSwitch: false, nodeId: candidate, reason: "min_display" };
    }

    setState("currentBackgroundNodeId", candidate);
    setState("lastSwitchNodeId", candidate);
    setState("lastSwitchAt", now);

    return { shouldSwitch: true, nodeId: candidate, reason: "stable" };
  };

  return {
    state,
    configure,
    setFrozen,
    observeNode,
  };
}

let _scenicModeStore: ReturnType<typeof createScenicModeStore> | null = null;

export function useScenicModeStore() {
  if (!_scenicModeStore) {
    _scenicModeStore = createScenicModeStore();
  }
  return _scenicModeStore;
}
