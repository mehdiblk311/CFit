import { useEffect, useMemo, useRef, useState } from 'react';
import client from '../../api/client';
import { authStore } from '../../stores/authStore';

const BASE_RECONNECT_DELAY_MS = 1200;
const MAX_RECONNECT_DELAY_MS = 15000;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRealtimePayload(rawMessage) {
  try {
    const parsed = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
    const payload = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (!payload || typeof payload !== 'object') return null;

    const activeUsers = toNumber(payload.active_users ?? payload.activeUsers);
    const workoutsToday = toNumber(payload.workouts_today ?? payload.workoutsToday);
    const mealsToday = toNumber(payload.meals_today ?? payload.mealsToday);
    const timestamp = payload.timestamp || null;

    if (activeUsers === null && workoutsToday === null && mealsToday === null && !timestamp) {
      return null;
    }

    return { activeUsers, workoutsToday, mealsToday, timestamp };
  } catch {
    return null;
  }
}

function resolveAuthMode() {
  const raw = String(import.meta.env.VITE_ADMIN_REALTIME_WS_AUTH_MODE || 'header').trim().toLowerCase();
  if (raw === 'query' || raw === 'none' || raw === 'off') return raw;
  return 'header';
}

function toWsUrl(baseURL, accessToken, authMode) {
  if (!baseURL) return null;
  if (authMode === 'off' || authMode === 'header') return null;

  try {
    const url = new URL('/v1/admin/dashboard/realtime', baseURL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

    if (authMode === 'query' && accessToken) {
      url.searchParams.set('access_token', accessToken);
    }

    return url.toString();
  } catch {
    return null;
  }
}

function reconnectDelay(attempt) {
  const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(MAX_RECONNECT_DELAY_MS, delay);
}

export function useAdminRealtime() {
  const accessToken = authStore((state) => state.access_token);
  const authMode = useMemo(resolveAuthMode, []);
  const [metrics, setMetrics] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // live | reconnecting | connecting | disconnected | disabled
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  const wsUrl = useMemo(
    () => toWsUrl(client.defaults.baseURL, accessToken, authMode),
    [accessToken, authMode]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !wsUrl) {
      setConnectionStatus('disabled');
      return undefined;
    }

    let isCancelled = false;

    const setSafeStatus = (nextStatus) => {
      setConnectionStatus((prev) => (prev === nextStatus ? prev : nextStatus));
    };

    const clearReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const cleanupSocket = () => {
      const current = socketRef.current;
      if (!current) return;
      current.onopen = null;
      current.onmessage = null;
      current.onerror = null;
      current.onclose = null;
      try {
        current.close();
      } catch {
        // no-op
      }
      socketRef.current = null;
    };

    const scheduleReconnect = () => {
      if (isCancelled) return;
      reconnectAttemptRef.current += 1;
      const delay = reconnectDelay(reconnectAttemptRef.current);
      setSafeStatus('reconnecting');
      clearReconnect();
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (isCancelled) return;

      cleanupSocket();
      setSafeStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptRef.current = 0;
          setSafeStatus('live');
        };

        ws.onmessage = (event) => {
          const nextMetrics = normalizeRealtimePayload(event.data);
          if (!nextMetrics) return;

          setMetrics((prev) => {
            if (
              prev &&
              prev.activeUsers === nextMetrics.activeUsers &&
              prev.workoutsToday === nextMetrics.workoutsToday &&
              prev.mealsToday === nextMetrics.mealsToday &&
              prev.timestamp === nextMetrics.timestamp
            ) {
              return prev;
            }
            return nextMetrics;
          });

          setSafeStatus('live');
        };

        ws.onerror = () => {
          if (isCancelled) return;
          setSafeStatus('reconnecting');
        };

        ws.onclose = () => {
          if (isCancelled) {
            setSafeStatus('disconnected');
            return;
          }
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      isCancelled = true;
      clearReconnect();
      cleanupSocket();
      setSafeStatus('disconnected');
    };
  }, [wsUrl]);

  return {
    metrics,
    connectionStatus,
    isLive: connectionStatus === 'live',
    mode: wsUrl ? 'websocket' : 'polling',
    authMode,
  };
}
