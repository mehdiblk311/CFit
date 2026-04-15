import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute, OnboardingRoute, AdminRoute } from './guards';

import Login                 from '../components/auth/Login';
import Signup                from '../components/auth/Signup';
import TwoFactorChallenge    from '../components/auth/TwoFactorChallenge';
import OnboardingFlow        from '../components/auth/OnboardingFlow';
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
import Notifications       from '../components/user/Notifications/Notifications';
import Settings            from '../components/user/Settings/Settings';
import AdminLayout         from '../components/admin/AdminLayout';
import AdminDashboard      from '../components/admin/AdminDashboard';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminExerciseLibrary from '../components/admin/AdminExerciseLibrary';
import AdminUserPrograms   from '../components/admin/AdminUserPrograms';
import AdminNutrition      from '../components/admin/Nutrition/AdminNutrition';

const router = createBrowserRouter([
  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },

  // Public routes (redirect to /dashboard if already authed+onboarded)
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',           element: <Login /> },
      { path: '/signup',          element: <Signup /> },
      { path: '/2fa-challenge',   element: <TwoFactorChallenge /> },
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
      { path: '/notifications', element: <Notifications /> },
      { path: '/settings',  element: <Settings /> },
    ],
  },

  // Admin routes
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,           element: <AdminDashboard /> },
          { path: 'users',         element: <AdminUserManagement /> },
          { path: 'exercises',     element: <AdminExerciseLibrary /> },
          { path: 'programs',      element: <AdminUserPrograms /> },
          { path: 'nutrition',     element: <AdminNutrition /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
