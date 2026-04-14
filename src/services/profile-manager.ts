// ==========================================
// Profile Manager Service - Multi-config Management
// ==========================================

import type { Profile, ProfileState } from '../types/clash';
import { clashApi } from './clash-api';

class ProfileManagerService {
  private profiles: Map<string, Profile> = new Map();
  private activeProfileId: string | null = null;

  /**
   * Get all profiles
   */
  getProfiles(): Profile[] {
    return Array.from(this.profiles.values()).sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return b.lastModified.localeCompare(a.lastModified);
    });
  }

  /**
   * Get active profile
   */
  getActiveProfile(): Profile | null {
    return this.activeProfileId ? this.profiles.get(this.activeProfileId) || null : null;
  }

  /**
   * Switch to profile
   */
  async switchProfile(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile) throw new Error('Profile not found');

    try {
      // Reload Clash with new config path
      await clashApi.reloadConfig(profile.path);
      
      // Update active status
      this.profiles.forEach(p => p.active = false);
      profile.active = true;
      this.activeProfileId = id;
      
      this.saveToStorage();
    } catch (error) {
      throw new Error(`Failed to switch profile: ${error}`);
    }
  }

  /**
   * Import profile from file
   */
  async importProfile(file: File): Promise<Profile> {
    const content = await file.text();
    const name = file.name.replace(/\.(yaml|yml)$/, '');
    
    const profile: Profile = {
      id: this.generateId(),
      name,
      path: `configs/${name}.yaml`,
      type: 'local',
      lastModified: new Date().toISOString(),
      size: file.size,
      active: false,
    };

    // Store content
    this.storeProfileContent(profile.id, content);
    
    this.profiles.set(profile.id, profile);
    this.saveToStorage();
    
    return profile;
  }

  /**
   * Import profile from URL
   */
  async importFromUrl(url: string, name?: string): Promise<Profile> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch config');
      
      const content = await response.text();
      const profileName = name || new URL(url).hostname;
      
      const profile: Profile = {
        id: this.generateId(),
        name: profileName,
        path: url,
        type: 'remote',
        url,
        lastModified: new Date().toISOString(),
        size: content.length,
        active: false,
      };

      this.storeProfileContent(profile.id, content);
      
      this.profiles.set(profile.id, profile);
      this.saveToStorage();
      
      return profile;
    } catch (error) {
      throw new Error(`Failed to import from URL: ${error}`);
    }
  }

  /**
   * Export profile
   */
  async exportProfile(id: string): Promise<Blob> {
    const content = this.getProfileContent(id);
    if (!content) throw new Error('Profile content not found');
    
    const profile = this.profiles.get(id);
    const filename = `${profile?.name || 'config'}.yaml`;
    
    return new Blob([content], { type: 'text/yaml' });
  }

  /**
   * Delete profile
   */
  async deleteProfile(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (profile?.active) {
      throw new Error('Cannot delete active profile');
    }
    
    this.profiles.delete(id);
    this.removeProfileContent(id);
    this.saveToStorage();
  }

  /**
   * Duplicate profile
   */
  async duplicateProfile(id: string): Promise<Profile> {
    const original = this.profiles.get(id);
    if (!original) throw new Error('Profile not found');
    
    const content = this.getProfileContent(id);
    
    const profile: Profile = {
      id: this.generateId(),
      name: `${original.name} (副本)`,
      path: `configs/${original.name}-copy.yaml`,
      type: original.type,
      url: original.url,
      lastModified: new Date().toISOString(),
      size: original.size,
      active: false,
    };

    if (content) {
      this.storeProfileContent(profile.id, content);
    }
    
    this.profiles.set(profile.id, profile);
    this.saveToStorage();
    
    return profile;
  }

  /**
   * Rename profile
   */
  renameProfile(id: string, newName: string): void {
    const profile = this.profiles.get(id);
    if (profile) {
      profile.name = newName;
      this.saveToStorage();
    }
  }

  /**
   * Update remote profile
   */
  async updateRemoteProfile(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (!profile || !profile.url) {
      throw new Error('Not a remote profile');
    }

    const response = await fetch(profile.url);
    if (!response.ok) throw new Error('Failed to fetch updates');
    
    const content = await response.text();
    profile.lastModified = new Date().toISOString();
    profile.size = content.length;
    
    this.storeProfileContent(id, content);
    this.saveToStorage();
  }

  // Storage helpers
  private generateId(): string {
    return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeProfileContent(id: string, content: string): void {
    try {
      localStorage.setItem(`hyperion-profile-${id}`, content);
    } catch (error) {
      console.error('Failed to store profile content:', error);
    }
  }

  private getProfileContent(id: string): string | null {
    try {
      return localStorage.getItem(`hyperion-profile-${id}`);
    } catch {
      return null;
    }
  }

  private removeProfileContent(id: string): void {
    try {
      localStorage.removeItem(`hyperion-profile-${id}`);
    } catch {
      // Ignore
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        profiles: Array.from(this.profiles.values()),
        activeProfileId: this.activeProfileId,
      };
      localStorage.setItem('hyperion-profiles', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save profiles:', error);
    }
  }

  loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('hyperion-profiles');
      if (saved) {
        const data = JSON.parse(saved);
        data.profiles.forEach((p: Profile) => {
          this.profiles.set(p.id, p);
        });
        this.activeProfileId = data.activeProfileId;
      }
    } catch {
      // Ignore errors
    }
  }
}

export const profileManager = new ProfileManagerService();
