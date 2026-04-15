import { authStore } from '../stores/authStore';
import { authAPI } from '../api/auth';
import { usersAPI } from '../api/users';
import { uiStore } from '../stores/uiStore';

export function useAuth() {
  const user = authStore((state) => state.user);
  const access_token = authStore((state) => state.access_token);
  const refresh_token = authStore((state) => state.refresh_token);
  const auth_bootstrapped = authStore((state) => state.auth_bootstrapped);
  const setUser = authStore((state) => state.setUser);
  const setTokens = authStore((state) => state.setTokens);
  const isAuthenticated = authStore((state) => state.isAuthenticated());
  const isOnboarded = authStore((state) => state.isOnboarded());
  const isAdmin = authStore((state) => state.isAdmin());

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

      // Check if 2FA is required
      if (response.two_factor_required) {
        authStore.getState().initiate2FA(response.user, response.two_factor_token);
        return { two_factor_required: true, user: response.user, two_factor_token: response.two_factor_token };
      }

      // Otherwise, full login success
      authStore.getState().login(response.user, response.access_token, response.refresh_token);
      return response;
    } catch (error) {
      const detail = error?.response?.data?.detail ?? error?.response?.data?.error ?? null;
      const enriched = new Error(detail || 'Login failed');
      enriched.status = error?.response?.status;
      enriched.detail = detail;
      throw enriched;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);

      // Check if 2FA is required
      if (response.two_factor_required) {
        authStore.getState().initiate2FA(response.user, response.two_factor_token);
        return { two_factor_required: true, user: response.user, two_factor_token: response.two_factor_token };
      }

      authStore.getState().login(response.user, response.access_token, response.refresh_token);
      return response;
    } catch (error) {
      // Extract backend detail message and attach it to the error
      const detail = error?.response?.data?.detail ?? error?.response?.data?.error ?? null;
      const enriched = new Error(detail || 'Signup failed');
      enriched.status = error?.response?.status;
      enriched.detail = detail;
      throw enriched;
    }
  };

  const complete2FA = async (totpCode, recoveryCode) => {
    try {
      const state = authStore.getState();
      const email = state.user?.email;
      const twoFactorToken = state.two_factor_token;

      if (!email || !twoFactorToken) {
        throw new Error('2FA challenge not initiated');
      }

      const response = await authAPI.login(email, '', twoFactorToken, totpCode, recoveryCode);

      authStore.getState().login(response.user, response.access_token, response.refresh_token);
      return response;
    } catch (error) {
      uiStore.getState().addToast('2FA verification failed', 'error');
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      authStore.getState().logout();
      localStorage.removeItem('um6p_fit_auth');
      localStorage.removeItem('um6p_fit_workout');
      localStorage.removeItem('um6p_fit_nutrition');
      localStorage.removeItem('um6p_fit_ui');
    }
  };

  const updateProfileData = async (userId, data) => {
    try {
      const response = await usersAPI.updateProfile(userId, data);
      authStore.getState().updateProfile(response);
      return response;
    } catch (error) {
      uiStore.getState().addToast('Profile update failed', 'error');
      throw error;
    }
  };

  return {
    user,
    access_token,
    refresh_token,
    auth_bootstrapped,
    isAuthenticated,
    isOnboarded,
    isAdmin,
    login,
    signup,
    complete2FA,
    logout: logoutUser,
    updateProfile: updateProfileData,
    setUser,
    setTokens,
  };
}
