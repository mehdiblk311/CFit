import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionAPI } from '../../api/nutrition';

export function useMeals(params = {}) {
  return useQuery({
    queryKey: ['meals', params],
    queryFn: () => nutritionAPI.getMeals(params),
    staleTime: 1000 * 30,
  });
}

export function useMeal(meal_id) {
  return useQuery({
    queryKey: ['meals', meal_id],
    queryFn: () => nutritionAPI.getMeal(meal_id),
    enabled: !!meal_id,
    staleTime: 1000 * 30,
  });
}

export function useSearchFoods(query, params = {}) {
  return useQuery({
    queryKey: ['foods', query, params],
    queryFn: () => nutritionAPI.searchFoods(query, params),
    enabled: !!query && query.length > 1,
    staleTime: 1000 * 30,
  });
}

export function useFood(food_id) {
  return useQuery({
    queryKey: ['foods', food_id],
    queryFn: () => nutritionAPI.getFood(food_id),
    enabled: !!food_id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecipes(params = {}) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => nutritionAPI.getRecipes(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRecipe(recipe_id) {
  return useQuery({
    queryKey: ['recipes', recipe_id],
    queryFn: () => nutritionAPI.getRecipe(recipe_id),
    enabled: !!recipe_id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFavorites(params = {}) {
  return useQuery({
    queryKey: ['favorites', params],
    queryFn: () => nutritionAPI.getFavorites(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => nutritionAPI.createMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useUpdateMeal(meal_id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => nutritionAPI.updateMeal(meal_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', meal_id] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useDeleteMeal(meal_id) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => nutritionAPI.deleteMeal(meal_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useAddFoodToMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meal_id, food_id, quantity }) =>
      nutritionAPI.addFoodToMeal(meal_id, food_id, quantity),
    onSuccess: (_, { meal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['meals', meal_id] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => nutritionAPI.createRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (food_id) => nutritionAPI.addFavorite(food_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (food_id) => nutritionAPI.removeFavorite(food_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
