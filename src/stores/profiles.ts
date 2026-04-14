// ==========================================
// Profiles State Store
// ==========================================

import { createSignal } from "solid-js";
import type { Profile } from "../types/clash";

export interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string | null;
  loading: boolean;
  error: string | null;
}

export function createProfilesStore() {
  const [state, setState] = createSignal<ProfilesState>({
    profiles: [],
    activeProfileId: null,
    loading: false,
    error: null,
  });

  const setProfiles = (profiles: Profile[]) => {
    setState(prev => ({ ...prev, profiles }));
  };

  const setActiveProfile = (id: string | null) => {
    setState(prev => ({
      ...prev,
      activeProfileId: id,
      profiles: prev.profiles.map(p => ({
        ...p,
        active: p.id === id,
      })),
    }));
  };

  const addProfile = (profile: Profile) => {
    setState(prev => ({
      ...prev,
      profiles: [...prev.profiles, profile],
    }));
  };

  const removeProfile = (id: string) => {
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== id),
    }));
  };

  const updateProfile = (id: string, updates: Partial<Profile>) => {
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  return {
    state,
    setProfiles,
    setActiveProfile,
    addProfile,
    removeProfile,
    updateProfile,
    setLoading,
    setError,
  };
}

let _profilesStore: ReturnType<typeof createProfilesStore> | null = null;

export function useProfilesStore() {
  if (!_profilesStore) {
    _profilesStore = createProfilesStore();
  }
  return _profilesStore;
}
