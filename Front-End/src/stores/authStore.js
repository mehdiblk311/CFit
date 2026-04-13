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

      // Actions
      setUser: (user) => set({ user }),

      setTokens: (access_token, refresh_token) => {
        set({ access_token, refresh_token });
      },

      login: (user, access_token, refresh_token) => {
        set({ user, access_token, refresh_token, two_factor_token: null, two_factor_required: false });
      },

      // Initiate 2FA challenge (save token, show challenge screen)
      initiate2FA: (user, twoFactorToken) => {
        set({ user, two_factor_token: twoFactorToken, two_factor_required: true, access_token: null, refresh_token: null });
      },

      logout: () => {
        set({ user: null, access_token: null, refresh_token: null, two_factor_token: null, two_factor_required: false });
      },

      updateProfile: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Computed getters
      isAuthenticated: () => {
        const state = get();
        return !!state.access_token && !!state.user;
      },

      isOnboarded: () => {
        const state = get();
        if (!state.user) return false;
        // Only trust the explicit flag set at the end of onboarding step 3.
        // Any backend-data fallback risks firing mid-flow (steps 1/2 update the
        // user object via API, which can merge a pre-existing tdee/goal/weight
        // back into the store and trigger a premature redirect to /dashboard).
        return !!state.user.onboarded;
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
