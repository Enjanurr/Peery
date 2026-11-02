import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import type { Role } from '../types/auth.ts';
import { homePathFor } from '../utils/roles.ts';

interface ProtectedRouteProps {
  /** Omit to allow any signed-in user. */
  allowedRoles?: Role[];
}

/**
 * Route guard. Usage:
 *   <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}> ...child routes... </Route>
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Signed in but wrong role: send them to their own home instead of a dead end.
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return <Outlet />;
}