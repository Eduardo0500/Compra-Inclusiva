/**
 * AuthContext – gestión simple de sesión en memoria.
 * Al hacer login carga automáticamente las preferencias de accesibilidad guardadas.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/user';
import { useAccessibility } from './AccessibilityContext';

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { loadPrefs } = useAccessibility();

  const login = useCallback(
    (u: User) => {
      setUser(u);
      // WCAG 3.3.7 – Entrada redundante: las preferencias se aplican solas
      loadPrefs(u.accessibilityPreferences);
    },
    [loadPrefs]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: user !== null }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
