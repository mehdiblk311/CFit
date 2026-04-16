import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nutritionStore } from './nutritionStore';

export function applyLanguageToDocument(lang) {
  if (typeof document === 'undefined') return;

  const safeLang = lang || 'en';
  const dir = safeLang === 'ar' ? 'rtl' : 'ltr';
  const html = document.documentElement;
  const body = document.body;

  html.setAttribute('dir', dir);
  html.setAttribute('lang', safeLang);
  html.classList.toggle('is-rtl', dir === 'rtl');
  html.classList.toggle('is-ltr', dir !== 'rtl');

  if (body) {
    body.setAttribute('dir', dir);
    body.dataset.dir = dir;
    body.dataset.lang = safeLang;
  }
}

export const uiStore = create(
  persist(
    (set, get) => ({
      // UI State
      language: 'en', // 'en', 'fr', 'ar'
      darkMode: false,
      workoutFrequency: 5, // 1-7 days
      offline: false,
      toasts: [], // array of { id, message, type, duration }
      activeModal: null,

      // Actions
      setDarkMode: (val) => {
        set({ darkMode: val });
        document.documentElement.classList.toggle('dark-mode', val);
      },

      setWorkoutFrequency: (days) => {
        set({ workoutFrequency: Math.min(7, Math.max(1, days)) });
      },

      setLanguage: (lang) => {
        set({ language: lang });
        applyLanguageToDocument(lang);
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

  applyLanguageToDocument(uiStore.getState().language);
  uiStore.persist?.onFinishHydration?.((state) => {
    applyLanguageToDocument(state.language);
  });
}
