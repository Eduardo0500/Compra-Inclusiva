/**
 * RequireAuth – protege rutas que requieren sesión activa o un rol específico.
 * Si el usuario no está autenticado redirige a /login.
 * Si está autenticado pero no tiene el rol requerido redirige a /login con aviso.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import type { UserRole } from '../types/user';
import type { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  /** Si se especifica, el usuario además debe tener este rol */
  role?: UserRole;
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
