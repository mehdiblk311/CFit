import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { workoutStore } from '../stores/workoutStore';
import { uiStore } from '../stores/uiStore';
import { server } from './msw/server';

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
  });
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});
