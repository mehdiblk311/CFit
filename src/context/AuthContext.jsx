import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext(null);

const STORAGE_KEY = 'um6p_fit_user';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadFromStorage);

  const isAuthenticated = Boolean(user);
  const isOnboarded    = user?.onboarded ?? false;
  const isAdmin        = user?.role === 'admin';

  // ── Login ────────────────────────────────────────────────────────────
  const login = useCallback(async (email, _password) => {
    // Simulate API — 1.5s delay
    await new Promise(r => setTimeout(r, 1500));

    // Re-hydrate existing user by email (mock: same device = same user)
    const stored = loadFromStorage();
    const isAdminEmail = email.toLowerCase().includes('admin');
    const userData =
      stored?.email === email
        ? stored
        : {
            id: Date.now(),
            email,
            name: email.split('@')[0],
            onboarded: false,
            profile: {},
            role: isAdminEmail ? 'admin' : 'user',
          };

    saveToStorage(userData);
    setUser(userData);
    return userData;
  }, []);

  // ── Signup ───────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, _password) => {
    await new Promise(r => setTimeout(r, 1800));
    const userData = {
      id: Date.now(),
      name,
      email,
      onboarded: false,
      profile: {},
    };
    saveToStorage(userData);
    setUser(userData);
    return userData;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    saveToStorage(null);
    setUser(null);
  }, []);

  // ── Onboarding helpers ───────────────────────────────────────────────
  const updateOnboardingStep = useCallback((stepData) => {
    setUser(prev => {
      const next = { ...prev, profile: { ...prev.profile, ...stepData } };
      saveToStorage(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((finalStepData = {}) => {
    setUser(prev => {
      const next = {
        ...prev,
        onboarded: true,
        profile: { ...prev.profile, ...finalStepData },
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isOnboarded,
      isAdmin,
      login,
      signup,
      logout,
      updateOnboardingStep,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
