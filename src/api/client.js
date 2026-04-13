import axios from 'axios';
import { authStore } from '../stores/authStore';

const API_BASE_URL = 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if a refresh is in progress to prevent multiple simultaneous refresh requests
let refreshPromise = null;

// Request interceptor: attach JWT token
client.interceptors.request.use(
  (config) => {
    const state = authStore.getState();
    const token = state.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If refresh is already in progress, wait for it
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const state = authStore.getState();
            const refresh_token = state.refresh_token;

            if (!refresh_token) {
              // No refresh token, log out
              authStore.getState().logout();
              window.location.href = '/login';
              throw new Error('No refresh token available');
            }

            try {
              const response = await axios.post(
                `${API_BASE_URL}/v1/auth/refresh`,
                { refresh_token },
                { timeout: 5000 }
              );

              const { access_token, refresh_token: new_refresh_token } = response.data;

              // Update tokens in store
              authStore.getState().setTokens(access_token, new_refresh_token);

              return access_token;
            } catch (refreshError) {
              // Refresh failed, log out
              authStore.getState().logout();
              window.location.href = '/login';
              throw refreshError;
            }
          })();
        }

        const newToken = await refreshPromise;
        refreshPromise = null;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (err) {
        refreshPromise = null;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
