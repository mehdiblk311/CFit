import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/common/AppLayout';

/**
 * PublicRoute — for /login, /signup, /forgot-password
 * If already authenticated + onboarded → /dashboard
 * If authenticated but not onboarded → /onboarding
 */
export function PublicRoute() {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (isAuthenticated && isOnboarded)  return <Navigate to="/dashboard" replace />;
  if (isAuthenticated && !isOnboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/**
 * OnboardingRoute — for /onboarding
 * If not authenticated → /login
 * If already onboarded → /dashboard
 */
export function OnboardingRoute() {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboarded)      return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * ProtectedRoute — for /dashboard, /workouts, /nutrition, /ai, /settings
 * If not authenticated → /login
 * If authenticated but not onboarded → /onboarding
 * Wraps content in AppLayout with nav driven by react-router location.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isOnboarded)     return <Navigate to="/onboarding" replace />;
  return <AppLayout><Outlet /></AppLayout>;
}

/**
 * AdminRoute — for /admin/*
 * If not authenticated → /login
 * If authenticated but not admin → /dashboard
 */
export function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin)         return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
