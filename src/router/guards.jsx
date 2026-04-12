import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/common/AppLayout';

/**
 * PublicRoute — for /login, /signup, /forgot-password
 * If already authenticated + admin → /admin
 * If already authenticated + onboarded user → /dashboard
 * If authenticated but not onboarded user → /onboarding
 */
export function PublicRoute() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isOnboarded) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

/**
 * OnboardingRoute — for /onboarding
 * If not authenticated → /login
 * If admin → /admin
 * If already onboarded user → /dashboard
 */
export function OnboardingRoute() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin)          return <Navigate to="/admin" replace />;
  if (isOnboarded)      return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * ProtectedRoute — for /dashboard, /workouts, /nutrition, /ai, /settings
 * If not authenticated → /login
 * If admin → /admin (admins are separate from normal app flow)
 * If authenticated user but not onboarded → /onboarding
 */
export function ProtectedRoute() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin)          return <Navigate to="/admin" replace />;
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
