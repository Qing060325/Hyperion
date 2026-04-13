// ==========================================
// Proxy Drag State Store
// ==========================================

import { createSignal } from "solid-js";
import type { ProxyGroupOrder } from "../types/clash";

export interface DragState {
  dragging: string | null;
  over: string | null;
  modified: Set<string>;
  orders: Map<string, string[]>;
}

export function createProxyDragStore() {
  const [state, setState] = createSignal<DragState>({
    dragging: null,
    over: null,
    modified: new Set(),
    orders: new Map(),
  });

  const setDragging = (id: string | null) => {
    setState(prev => ({ ...prev, dragging: id }));
  };

  const setOver = (id: string | null) => {
    setState(prev => ({ ...prev, over: id }));
  };

  const setOrder = (group: string, proxies: string[]) => {
    setState(prev => {
      const orders = new Map(prev.orders);
      orders.set(group, proxies);
      return {
        ...prev,
        orders,
        modified: new Set([...prev.modified, group]),
      };
    });
  };

  const getOrder = (group: string): string[] | undefined => {
    return state().orders.get(group);
  };

  const markSaved = (group: string) => {
    setState(prev => {
      const modified = new Set(prev.modified);
      modified.delete(group);
      return { ...prev, modified };
    });
  };

  const hasModifications = () => state().modified.size > 0;

  const reset = () => {
    setState({
      dragging: null,
      over: null,
      modified: new Set(),
      orders: new Map(),
    });
  };

  return {
    state,
    setDragging,
    setOver,
    setOrder,
    getOrder,
    markSaved,
    hasModifications,
    reset,
  };
}

let _proxyDragStore: ReturnType<typeof createProxyDragStore> | null = null;

export function useProxyDragStore() {
  if (!_proxyDragStore) {
    _proxyDragStore = createProxyDragStore();
  }
  return _proxyDragStore;
}
