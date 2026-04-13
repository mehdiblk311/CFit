import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { authStore } from '../../stores/authStore';

export function useAnalyticsDashboard(params = {}) {
  const userId = authStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['analytics', userId, 'dashboard', params],
    queryFn: () => analyticsAPI.getDashboard(userId, params),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useWorkoutVolume(params = {}) {
  const userId = authStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['analytics', userId, 'volume', params],
    queryFn: () => analyticsAPI.getWorkoutVolume(userId, params),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePersonalRecords(params = {}) {
  const userId = authStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['analytics', userId, 'records', params],
    queryFn: () => analyticsAPI.getRecords(userId, params),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useActivityCalendar(params = {}) {
  const userId = authStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['analytics', userId, 'calendar', params],
    queryFn: () => analyticsAPI.getActivityCalendar(userId, params),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWeeklyStats(params = {}) {
  const userId = authStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['analytics', userId, 'weekly-stats', params],
    queryFn: () => analyticsAPI.getWeeklyStats(userId, params),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMeasurements(params = {}) {
  const userId = authStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['analytics', userId, 'measurements', params],
    queryFn: () => analyticsAPI.getMeasurements(userId, params),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
