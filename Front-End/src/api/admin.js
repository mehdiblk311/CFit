import client from './client';

export const adminAPI = {
  // Get admin dashboard data
  getDashboard: async (params = {}) => {
    const [summaryRes, trendsRes] = await Promise.all([
      client.get('/v1/admin/dashboard/summary', { params }),
      client.get('/v1/admin/dashboard/trends', { params }),
    ]);
    return {
      summary: summaryRes.data,
      trends: trendsRes.data,
    };
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
  deleteUser: async (user_id, params = { confirm: 'true' }) => {
    const response = await client.delete(`/v1/admin/users/${user_id}`, { params });
    return response.data;
  },

  // Get system metrics
  getMetrics: async (params = {}) => {
    const [userStats, userGrowth, workoutStats, nutritionStats, moderationStats] = await Promise.all([
      client.get('/v1/admin/users/stats', { params }),
      client.get('/v1/admin/users/growth', { params }),
      client.get('/v1/admin/workouts/stats', { params }),
      client.get('/v1/admin/nutrition/stats', { params }),
      client.get('/v1/admin/moderation/stats', { params }),
    ]);
    return {
      users: userStats.data,
      growth: userGrowth.data,
      workouts: workoutStats.data,
      nutrition: nutritionStats.data,
      moderation: moderationStats.data,
    };
  },

  getNutritionStats: async (params = {}) => {
    const response = await client.get('/v1/admin/nutrition/stats', { params });
    return response.data;
  },

  getFoods: async (params = {}) => {
    const response = await client.get('/v1/foods', { params });
    return response.data;
  },

  createFood: async (data) => {
    const response = await client.post('/v1/foods', data);
    return response.data;
  },

  updateFood: async (food_id, data) => {
    const response = await client.patch(`/v1/foods/${food_id}`, data);
    return response.data;
  },

  deleteFood: async (food_id) => {
    const response = await client.delete(`/v1/foods/${food_id}`);
    return response.data;
  },

  // Get activity logs
  getLogs: async (params = {}) => {
    const response = await client.get('/v1/admin/audit-logs', { params });
    return response.data;
  },

  // Get system health
  getSystemHealth: async () => {
    const response = await client.get('/v1/admin/system/health');
    return response.data;
  },

  // Programs (admin)
  getPrograms: async (params = {}) => {
    const response = await client.get('/v1/programs', { params });
    return response.data;
  },

  getProgram: async (program_id) => {
    const response = await client.get(`/v1/programs/${program_id}`);
    return response.data;
  },

  createProgram: async (data) => {
    const response = await client.post('/v1/programs', data);
    return response.data;
  },

  updateProgram: async (program_id, data) => {
    const response = await client.patch(`/v1/programs/${program_id}`, data);
    return response.data;
  },

  deleteProgram: async (program_id) => {
    const response = await client.delete(`/v1/programs/${program_id}`);
    return response.data;
  },

  // Program weeks (admin)
  createProgramWeek: async (program_id, data) => {
    const response = await client.post(`/v1/programs/${program_id}/weeks`, data);
    return response.data;
  },

  updateProgramWeek: async (week_id, data) => {
    const response = await client.patch(`/v1/program-weeks/${week_id}`, data);
    return response.data;
  },

  deleteProgramWeek: async (week_id) => {
    const response = await client.delete(`/v1/program-weeks/${week_id}`);
    return response.data;
  },

  // Program sessions (admin)
  createProgramSession: async (week_id, data) => {
    const response = await client.post(`/v1/program-weeks/${week_id}/sessions`, data);
    return response.data;
  },

  updateProgramSession: async (session_id, data) => {
    const response = await client.patch(`/v1/program-sessions/${session_id}`, data);
    return response.data;
  },

  deleteProgramSession: async (session_id) => {
    const response = await client.delete(`/v1/program-sessions/${session_id}`);
    return response.data;
  },

  // Program assignments (admin)
  getProgramAssignments: async (program_id) => {
    const response = await client.get(`/v1/programs/${program_id}/assignments`);
    return response.data;
  },

  createProgramAssignment: async (program_id, data) => {
    const response = await client.post(`/v1/programs/${program_id}/assignments`, data);
    return response.data;
  },

  updateProgramAssignment: async (assignment_id, data) => {
    const response = await client.patch(`/v1/admin/program-assignments/${assignment_id}`, data);
    return response.data;
  },

  deleteProgramAssignment: async (assignment_id) => {
    const response = await client.delete(`/v1/admin/program-assignments/${assignment_id}`);
    return response.data;
  },
};
