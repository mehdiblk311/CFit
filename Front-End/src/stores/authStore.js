import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const authStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      access_token: null,
      refresh_token: null,
      two_factor_token: null, // Temporary token for 2FA challenge phase
      two_factor_required: false, // Flag to trigger 2FA screen
      auth_bootstrapped: false,

      // Actions
      setUser: (user) => set({ user }),

      setTokens: (access_token, refresh_token) => {
        set({ access_token, refresh_token });
      },

      setAuthBootstrapped: (value) => {
        set({ auth_bootstrapped: value });
      },

      login: (user, access_token, refresh_token) => {
        set({
          user,
          access_token,
          refresh_token,
          two_factor_token: null,
          two_factor_required: false,
          auth_bootstrapped: true,
        });
      },

      // Initiate 2FA challenge (save token, show challenge screen)
      initiate2FA: (user, twoFactorToken) => {
        set({
          user,
          two_factor_token: twoFactorToken,
          two_factor_required: true,
          access_token: null,
          refresh_token: null,
          auth_bootstrapped: true,
        });
      },

      logout: () => {
        set({
          user: null,
          access_token: null,
          refresh_token: null,
          two_factor_token: null,
          two_factor_required: false,
          auth_bootstrapped: true,
        });
      },

      updateProfile: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Computed getters
      isAuthenticated: () => {
        const state = get();
        // Access token lives in memory; after a refresh/reload we can rely on refresh_token
        // while the app silently refreshes and restores the access token.
        return !!state.user && !!(state.access_token || state.refresh_token);
      },

      isOnboarded: () => {
        const state = get();
        if (!state.user) return false;
        // Backend has no explicit onboarded flag; profile completeness is the source of truth.
        return !!(state.user.weight && state.user.height && state.user.goal);
      },

      isAdmin: () => {
        const state = get();
        return state.user && state.user.role === 'admin';
      },
    }),
    {
      name: 'um6p_fit_auth',
      // Only persist specific fields to localStorage
      partialize: (state) => ({
        user: state.user,
        refresh_token: state.refresh_token,
        two_factor_token: state.two_factor_token,
        two_factor_required: state.two_factor_required,
        // Do NOT persist access_token (keep in memory only)
      }),
    }
  )
);
