import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute, OnboardingRoute, AdminRoute } from './guards';

import Login               from '../components/auth/Login';
import Signup              from '../components/auth/Signup';
import ForgotPasswordFlow  from '../components/auth/ForgotPasswordFlow';
import OnboardingFlow      from '../components/auth/OnboardingFlow';
import Dashboard           from '../components/user/Dashboard/Dashboard';
import Workouts            from '../components/user/Workouts/Workouts';
import NutritionLayout     from '../components/user/Nutrition/Layout/NutritionLayout';
import NutritionDashboard  from '../components/user/Nutrition/Dashboard/Nutrition';
import NutritionHistory    from '../components/user/Nutrition/History/NutritionHistory';
import FoodSearch          from '../components/user/Nutrition/FoodSearch/FoodSearch';
import AddQuantity         from '../components/user/Nutrition/AddQuantity/AddQuantity';
import CreateRecipe        from '../components/user/Nutrition/CreateRecipe/CreateRecipe';
import CustomFood          from '../components/user/Nutrition/CustomFood/CustomFood';
import AIAssistant         from '../components/user/AIAssistant/AIAssistant';
import Settings            from '../components/user/Settings/Settings';
import Admin               from '../components/admin/Admin';

const router = createBrowserRouter([
  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },

  // Public routes (redirect to /dashboard if already authed+onboarded)
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',           element: <Login /> },
      { path: '/signup',          element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPasswordFlow /> },
    ],
  },

  // Onboarding (authed but not yet onboarded)
  {
    element: <OnboardingRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingFlow /> },
    ],
  },

  // Protected app routes (authed + onboarded, wrapped in AppLayout)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/workouts',  element: <Workouts /> },
      {
        path: '/nutrition',
        element: <NutritionLayout />,
        children: [
          { index: true,              element: <NutritionDashboard /> },
          { path: 'history',          element: <NutritionHistory /> },
          { path: 'food-search',      element: <FoodSearch /> },
          { path: 'add-quantity',     element: <AddQuantity /> },
          { path: 'recipe',           element: <CreateRecipe /> },
          { path: 'custom-food',      element: <CustomFood /> },
        ],
      },
      { path: '/ai',        element: <AIAssistant /> },
      { path: '/settings',  element: <Settings /> },
    ],
  },

  // Admin routes
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin',   element: <Admin /> },
      { path: '/admin/*', element: <Admin /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
