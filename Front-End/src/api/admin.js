import client from './client';

export const adminAPI = {
  // Get admin dashboard data
  getDashboard: async (params = {}) => {
    const response = await client.get('/v1/admin/dashboard', { params });
    return response.data;
  },

  // Get list of users (admin)
  getUsers: async (params = {}) => {
    const response = await client.get('/v1/admin/users', { params });
    return response.data;
  },

  // Get single user (admin)
  getUser: async (user_id) => {
    const response = await client.get(`/v1/admin/users/${user_id}`);
    return response.data;
  },

  // Update user (admin)
  updateUser: async (user_id, data) => {
    const response = await client.patch(`/v1/admin/users/${user_id}`, data);
    return response.data;
  },

  // Ban user
  banUser: async (user_id, reason = '') => {
    const response = await client.post(`/v1/admin/users/${user_id}/ban`, { reason });
    return response.data;
  },

  // Unban user
  unbanUser: async (user_id) => {
    const response = await client.post(`/v1/admin/users/${user_id}/unban`);
    return response.data;
  },

  // Delete user
  deleteUser: async (user_id) => {
    const response = await client.delete(`/v1/admin/users/${user_id}`);
    return response.data;
  },

  // Get system metrics
  getMetrics: async (params = {}) => {
    const response = await client.get('/v1/admin/metrics', { params });
    return response.data;
  },

  // Get activity logs
  getLogs: async (params = {}) => {
    const response = await client.get('/v1/admin/logs', { params });
    return response.data;
  },
};
