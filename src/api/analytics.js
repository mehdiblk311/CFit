import client from './client';

export const analyticsAPI = {
  // Get analytics dashboard data
  getDashboard: async (user_id, params = {}) => {
    const response = await client.get(`/v1/users/${user_id}/analytics`, { params });
    return response.data;
  },

  // Get workout volume (total weight lifted)
  getWorkoutVolume: async (user_id, params = {}) => {
    const response = await client.get(`/v1/users/${user_id}/analytics/volume`, { params });
    return response.data;
  },

  // Get personal records by exercise
  getRecords: async (user_id, params = {}) => {
    const response = await client.get(`/v1/users/${user_id}/records`, { params });
    return response.data;
  },

  // Get activity calendar
  getActivityCalendar: async (user_id, params = {}) => {
    const response = await client.get(`/v1/users/${user_id}/activity-calendar`, { params });
    return response.data;
  },

  // Get weekly stats
  getWeeklyStats: async (user_id, params = {}) => {
    const response = await client.get(`/v1/users/${user_id}/weekly-stats`, { params });
    return response.data;
  },

  // Get body measurements progress
  getMeasurements: async (user_id, params = {}) => {
    const response = await client.get(`/v1/users/${user_id}/measurements`, { params });
    return response.data;
  },
};
