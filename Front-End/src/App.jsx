import { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  isRouteErrorResponse,
  Navigate,
  RouterProvider,
  useRouteError,
} from 'react-router-dom';
import { PublicRoute, ProtectedRoute, OnboardingRoute, AdminRoute } from './router/guards';
import { initAuth } from './hooks/useAuth';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import TwoFactorChallenge from './components/auth/TwoFactorChallenge';
import OnboardingFlow from './components/auth/OnboardingFlow';
import Dashboard from './components/user/Dashboard/Dashboard';
import Workouts from './components/user/Workouts/Workouts';
import NutritionLayout from './components/user/Nutrition/Layout/NutritionLayout';
import NutritionDashboard from './components/user/Nutrition/Dashboard/Nutrition';
import NutritionHistory from './components/user/Nutrition/History/NutritionHistory';
import FoodSearch from './components/user/Nutrition/FoodSearch/FoodSearch';
import AddQuantity from './components/user/Nutrition/AddQuantity/AddQuantity';
import CreateRecipe from './components/user/Nutrition/CreateRecipe/CreateRecipe';
import CustomFood from './components/user/Nutrition/CustomFood/CustomFood';
import AIAssistant from './components/user/AIAssistant/AIAssistant';
import Settings from './components/user/Settings/Settings';
import Admin from './components/admin/Admin';

function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'Please refresh the page and try again.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = typeof error.data === 'string' ? error.data : message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f2ea' }}>
      <div style={{ maxWidth: 520, width: '100%', background: '#fff', border: '1px solid #e8e2d6', borderRadius: 24, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <p style={{ margin: 0, color: '#38671a', fontWeight: 700, letterSpacing: '0.08em' }}>UM6P_FIT</p>
        <h1 style={{ margin: '12px 0 8px', fontSize: 28 }}>{title}</h1>
        <p style={{ margin: 0, color: '#5b5c5a', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ border: 0, borderRadius: 999, background: '#38671a', color: '#fff', padding: '12px 16px', cursor: 'pointer' }}
          >
            Reload page
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = '/dashboard')}
            style={{ borderRadius: 999, border: '1px solid #d7d0c5', background: '#fff', color: '#2b2c2a', padding: '12px 16px', cursor: 'pointer' }}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },

      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/signup', element: <Signup /> },
          { path: '/2fa-challenge', element: <TwoFactorChallenge /> },
        ],
      },

      {
        element: <OnboardingRoute />,
        children: [
          { path: '/onboarding', element: <OnboardingFlow /> },
        ],
      },

      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/workouts', element: <Workouts /> },
          {
            path: '/nutrition',
            element: <NutritionLayout />,
            children: [
              { index: true, element: <NutritionDashboard /> },
              { path: 'history', element: <NutritionHistory /> },
              { path: 'food-search', element: <FoodSearch /> },
              { path: 'add-quantity', element: <AddQuantity /> },
              { path: 'recipe', element: <CreateRecipe /> },
              { path: 'custom-food', element: <CustomFood /> },
            ],
          },
          { path: '/ai', element: <AIAssistant /> },
          { path: '/settings', element: <Settings /> },
        ],
      },

      {
        element: <AdminRoute />,
        children: [
          { path: '/admin', element: <Admin /> },
          { path: '/admin/*', element: <Admin /> },
        ],
      },
    ],
  },
]);

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return <RouterProvider router={router} />;
}
