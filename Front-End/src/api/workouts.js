import client from './client';

export const workoutsAPI = {
  // Get workout history
  getWorkouts: async (params = {}) => {
    const response = await client.get('/v1/workouts', { params });
    return response.data;
  },

  // Get single workout
  getWorkout: async (workout_id) => {
    const response = await client.get(`/v1/workouts/${workout_id}`);
    return response.data;
  },

  // Create new workout
  createWorkout: async (data) => {
    const response = await client.post('/v1/workouts', data);
    return response.data;
  },

  // Update workout
  updateWorkout: async (workout_id, data) => {
    const response = await client.patch(`/v1/workouts/${workout_id}`, data);
    return response.data;
  },

  // Add exercise to workout
  addExercise: async (workout_id, exercise_id, notes = '') => {
    const response = await client.post(`/v1/workouts/${workout_id}/exercises`, {
      exercise_id,
      notes,
    });
    return response.data;
  },

  // Log a set for an exercise
  addSet: async (workout_id, exercise_id, data) => {
    const response = await client.post(
      `/v1/workouts/${workout_id}/exercises/${exercise_id}/sets`,
      data
    );
    return response.data;
  },

  // Add cardio entry
  addCardio: async (workout_id, data) => {
    const response = await client.post(`/v1/workouts/${workout_id}/cardio`, data);
    return response.data;
  },

  // Get workout templates
  getTemplates: async (params = {}) => {
    const response = await client.get('/v1/workout-templates', { params });
    return response.data;
  },

  // Get single template
  getTemplate: async (template_id) => {
    const response = await client.get(`/v1/workout-templates/${template_id}`);
    return response.data;
  },

  // Create workout template
  createTemplate: async (data) => {
    const response = await client.post('/v1/workout-templates', data);
    return response.data;
  },

  // Search exercise library
  searchExercises: async (params = {}) => {
    const response = await client.get('/v1/exercises', { params });
    return response.data;
  },

  // Get exercise history
  getExerciseHistory: async (exercise_id, params = {}) => {
    const response = await client.get(`/v1/exercises/${exercise_id}/history`, { params });
    return response.data;
  },

  // Get workout programs
  getPrograms: async (params = {}) => {
    const response = await client.get('/v1/programs', { params });
    return response.data;
  },

  // Get program assignments
  getProgramAssignments: async (params = {}) => {
    const response = await client.get('/v1/program-assignments', { params });
    return response.data;
  },
};
