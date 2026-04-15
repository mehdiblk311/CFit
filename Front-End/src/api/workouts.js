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
      `/v1/workout-exercises/${exercise_id}/sets`,
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

  // Apply workout template
  applyTemplate: async (template_id, data) => {
    const response = await client.post(`/v1/workout-templates/${template_id}/apply`, data);
    return response.data;
  },

  // Search exercise library
  searchExercises: async (params = {}) => {
    const nextParams = { ...params };
    if (nextParams.q) {
      nextParams.name = nextParams.q;
      delete nextParams.q;
    }
    const response = await client.get('/v1/exercises', { params: nextParams });
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

  // Get program assignment details
  getProgramAssignment: async (assignment_id) => {
    const response = await client.get(`/v1/program-assignments/${assignment_id}`);
    return response.data;
  },

  // Update own program assignment status
  updateProgramAssignmentStatus: async (assignment_id, status) => {
    const response = await client.patch(`/v1/program-assignments/${assignment_id}/status`, { status });
    return response.data;
  },

  // Apply a program session to today's workout
  applyProgramSession: async (session_id, data = {}) => {
    const response = await client.post(`/v1/program-sessions/${session_id}/apply`, data);
    return response.data;
  },

  // Delete workout
  deleteWorkout: async (workout_id) => {
    const response = await client.delete(`/v1/workouts/${workout_id}`);
    return response.data;
  },

  // Update a set
  updateSet: async (set_id, data) => {
    const response = await client.patch(`/v1/workout-sets/${set_id}`, data);
    return response.data;
  },

  // Delete a set
  deleteSet: async (set_id) => {
    const response = await client.delete(`/v1/workout-sets/${set_id}`);
    return response.data;
  },

  // Update a workout exercise
  updateWorkoutExercise: async (exercise_id, data) => {
    const response = await client.patch(`/v1/workout-exercises/${exercise_id}`, data);
    return response.data;
  },

  // Delete a workout exercise
  deleteWorkoutExercise: async (exercise_id) => {
    const response = await client.delete(`/v1/workout-exercises/${exercise_id}`);
    return response.data;
  },

  // Get sets for a workout exercise
  getExerciseSets: async (exercise_id) => {
    const response = await client.get(`/v1/workout-exercises/${exercise_id}/sets`);
    return response.data;
  },

  // Update cardio entry
  updateCardio: async (cardio_id, data) => {
    const response = await client.patch(`/v1/workout-cardio/${cardio_id}`, data);
    return response.data;
  },

  // Delete cardio entry
  deleteCardio: async (cardio_id) => {
    const response = await client.delete(`/v1/workout-cardio/${cardio_id}`);
    return response.data;
  },

  // Get cardio entries for workout
  getCardio: async (workout_id) => {
    const response = await client.get(`/v1/workouts/${workout_id}/cardio`);
    return response.data;
  },

  // Get single exercise
  getExercise: async (exercise_id) => {
    const response = await client.get(`/v1/exercises/${exercise_id}`);
    return response.data;
  },

  // Create exercise
  createExercise: async (data) => {
    const response = await client.post('/v1/exercises', data);
    return response.data;
  },

  // Update exercise
  updateExercise: async (exercise_id, data) => {
    const response = await client.patch(`/v1/exercises/${exercise_id}`, data);
    return response.data;
  },

  // Delete exercise
  deleteExercise: async (exercise_id) => {
    const response = await client.delete(`/v1/exercises/${exercise_id}`);
    return response.data;
  },

  // Semantic search
  semanticSearchExercises: async (query) => {
    const response = await client.post('/v1/exercises/search', { query });
    return response.data;
  },

  // Get exercise library meta (filters)
  getExerciseMeta: async () => {
    const response = await client.get('/v1/exercises/library-meta');
    return response.data;
  },
};
