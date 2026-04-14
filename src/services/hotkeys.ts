// ==========================================
// Hotkey Service - Global Keyboard Shortcuts
// ==========================================

import type { HotkeyBinding, HotkeyAction } from '../types/hotkey';
import { DEFAULT_HOTKEYS } from '../types/hotkey';

type HotkeyHandler = () => void;

class HotkeyService {
  private bindings: Map<string, HotkeyBinding> = new Map();
  private handlers: Map<HotkeyAction, HotkeyHandler> = new Map();
  private enabled = true;

  constructor() {
    this.loadFromStorage();
    this.attachListener();
  }

  /**
   * Register a hotkey binding
   */
  register(binding: HotkeyBinding): void {
    this.bindings.set(binding.id, binding);
    this.saveToStorage();
  }

  /**
   * Unregister a hotkey binding
   */
  unregister(id: string): void {
    this.bindings.delete(id);
    this.saveToStorage();
  }

  /**
   * Register action handler
   */
  onAction(action: HotkeyAction, handler: HotkeyHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * Remove action handler
   */
  offAction(action: HotkeyAction): void {
    this.handlers.delete(action);
  }

  /**
   * Get all bindings
   */
  getBindings(): HotkeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Update binding
   */
  updateBinding(id: string, updates: Partial<HotkeyBinding>): void {
    const binding = this.bindings.get(id);
    if (binding) {
      this.bindings.set(id, { ...binding, ...updates });
      this.saveToStorage();
    }
  }

  /**
   * Enable/disable hotkeys
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.bindings.clear();
    DEFAULT_HOTKEYS.forEach(b => this.bindings.set(b.id, b));
    this.saveToStorage();
  }

  /**
   * Parse keyboard event to string
   */
  private parseEvent(e: KeyboardEvent): { key: string; modifiers: string[] } | null {
    // Ignore if typing in input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return null;
    }

    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');

    // Need at least one modifier
    if (modifiers.length === 0) return null;

    const key = e.key.toUpperCase();
    
    return { key, modifiers };
  }

  /**
   * Match event against bindings
   */
  private matchBinding(key: string, modifiers: string[]): HotkeyBinding | null {
    for (const binding of this.bindings.values()) {
      if (!binding.enabled) continue;
      
      const modsMatch = 
        binding.modifiers.length === modifiers.length &&
        binding.modifiers.every(m => modifiers.includes(m));
      
      if (modsMatch && binding.key === key) {
        return binding;
      }
    }
    return null;
  }

  /**
   * Handle keyboard event
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;

    const parsed = this.parseEvent(e);
    if (!parsed) return;

    const binding = this.matchBinding(parsed.key, parsed.modifiers);
    if (binding) {
      e.preventDefault();
      e.stopPropagation();
      
      const handler = this.handlers.get(binding.action);
      if (handler) {
        handler();
      }
    }
  };

  /**
   * Attach keyboard listener
   */
  private attachListener(): void {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Detach keyboard listener
   */
  detachListener(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Save bindings to storage
   */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(Array.from(this.bindings.values()));
      localStorage.setItem('hyperion-hotkeys', data);
    } catch (error) {
      console.error('Failed to save hotkeys:', error);
    }
  }

  /**
   * Load bindings from storage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('hyperion-hotkeys');
      if (saved) {
        const bindings = JSON.parse(saved) as HotkeyBinding[];
        bindings.forEach(b => this.bindings.set(b.id, b));
      } else {
        // Load defaults
        DEFAULT_HOTKEYS.forEach(b => this.bindings.set(b.id, b));
      }
    } catch {
      DEFAULT_HOTKEYS.forEach(b => this.bindings.set(b.id, b));
    }
  }
}

export const hotkeyService = new HotkeyService();
