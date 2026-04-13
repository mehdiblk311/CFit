import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsAPI } from '../../api/workouts';

export function useWorkoutList(params = {}) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn: () => workoutsAPI.getWorkouts(params),
    staleTime: 1000 * 30,
  });
}

export function useWorkout(workout_id) {
  return useQuery({
    queryKey: ['workouts', workout_id],
    queryFn: () => workoutsAPI.getWorkout(workout_id),
    enabled: !!workout_id,
    staleTime: 1000 * 30,
  });
}

export function useTemplateList(params = {}) {
  return useQuery({
    queryKey: ['workout-templates', params],
    queryFn: () => workoutsAPI.getTemplates(params),
    staleTime: 1000 * 60 * 5, // 5 minutes for templates
  });
}

export function useTemplate(template_id) {
  return useQuery({
    queryKey: ['workout-templates', template_id],
    queryFn: () => workoutsAPI.getTemplate(template_id),
    enabled: !!template_id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useExerciseHistory(exercise_id, params = {}) {
  return useQuery({
    queryKey: ['exercises', exercise_id, 'history', params],
    queryFn: () => workoutsAPI.getExerciseHistory(exercise_id, params),
    enabled: !!exercise_id,
    staleTime: 1000 * 30,
  });
}

export function useWorkoutPrograms(params = {}) {
  return useQuery({
    queryKey: ['programs', params],
    queryFn: () => workoutsAPI.getPrograms(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProgramAssignments(params = {}) {
  return useQuery({
    queryKey: ['program-assignments', params],
    queryFn: () => workoutsAPI.getProgramAssignments(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => workoutsAPI.createWorkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUpdateWorkout(workout_id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => workoutsAPI.updateWorkout(workout_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workout_id] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useExercises(params = {}) {
  return useQuery({
    queryKey: ['exercises', params],
    queryFn: () => workoutsAPI.searchExercises(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workout_id, exercise_id, notes }) =>
      workoutsAPI.addExercise(workout_id, exercise_id, notes),
    onSuccess: (_, { workout_id }) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workout_id] });
    },
  });
}

export function useFinishWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workout_id, data }) => workoutsAPI.updateWorkout(workout_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workout_id, exercise_id, data }) =>
      workoutsAPI.addSet(workout_id, exercise_id, data),
    onSuccess: (_, { workout_id }) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workout_id] });
    },
  });
}
