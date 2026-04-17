import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { workoutStore } from '../stores/workoutStore';
import { uiStore } from '../stores/uiStore';
import { server } from './msw/server';

function createMemoryStorage() {
  let store = {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

const memoryLocalStorage = createMemoryStorage();
const memorySessionStorage = createMemoryStorage();

Object.defineProperty(window, 'localStorage', {
  value: memoryLocalStorage,
  configurable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: memorySessionStorage,
  configurable: true,
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  localStorage.clear();
  workoutStore.setState({
    activeWorkout: null,
    restTimerActive: false,
    restSeconds: 0,
    pendingSets: [],
  });
  uiStore.setState({
    language: 'en',
    offline: false,
    toasts: [],
    activeModal: null,
    workoutFrequencyByUser: {},
  });
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});
