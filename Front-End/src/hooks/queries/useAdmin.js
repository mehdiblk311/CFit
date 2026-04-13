import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin';

export function useAdminDashboard(params = {}) {
  return useQuery({
    queryKey: ['admin', 'dashboard', params],
    queryFn: () => adminAPI.getDashboard(params),
    staleTime: 1000 * 30,
  });
}

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminAPI.getUsers(params),
    staleTime: 1000 * 30,
  });
}

export function useAdminUser(user_id) {
  return useQuery({
    queryKey: ['admin', 'users', user_id],
    queryFn: () => adminAPI.getUser(user_id),
    enabled: !!user_id,
    staleTime: 1000 * 30,
  });
}

export function useAdminMetrics(params = {}) {
  return useQuery({
    queryKey: ['admin', 'metrics', params],
    queryFn: () => adminAPI.getMetrics(params),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useAdminLogs(params = {}) {
  return useQuery({
    queryKey: ['admin', 'logs', params],
    queryFn: () => adminAPI.getLogs(params),
    staleTime: 1000 * 30,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ user_id, reason }) => adminAPI.banUser(user_id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user_id) => adminAPI.unbanUser(user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ user_id, data }) => adminAPI.updateUser(user_id, data),
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', user_id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user_id) => adminAPI.deleteUser(user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
