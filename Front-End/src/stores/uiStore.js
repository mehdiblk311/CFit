import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nutritionStore } from './nutritionStore';

export const uiStore = create(
  persist(
    (set, get) => ({
      // UI State
      language: 'en', // 'en', 'fr', 'ar'
      offline: false,
      toasts: [], // array of { id, message, type, duration }
      activeModal: null,

      // Actions
      setLanguage: (lang) => {
        set({ language: lang });
        // Apply RTL for Arabic
        const html = document.documentElement;
        if (lang === 'ar') {
          html.setAttribute('dir', 'rtl');
          html.setAttribute('lang', 'ar');
        } else {
          html.setAttribute('dir', 'ltr');
          html.setAttribute('lang', lang);
        }
      },

      setOffline: (offline) => {
        set({ offline });
      },

      addToast: (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id, message, type, duration },
          ],
        }));

        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }

        return id;
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      setActiveModal: (modal) => {
        set({ activeModal: modal });
      },

      closeModal: () => {
        set({ activeModal: null });
      },
    }),
    {
      name: 'um6p_fit_ui',
    }
  )
);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    uiStore.getState().setOffline(false);
    // Do not clear pending workout sets on reconnect.
    // Replay is handled by the workout feature to avoid data loss.
    nutritionStore.getState().flushPendingMeals();
    nutritionStore.getState().flushPendingFoods();
  });

  window.addEventListener('offline', () => {
    uiStore.getState().setOffline(true);
  });

  // Initialize language on load
  const { language } = uiStore.getState();
  if (language === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
  }
}
