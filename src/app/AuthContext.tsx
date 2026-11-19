/**
 * AuthContext – gestión de sesión.
 * Persiste el usuario en sessionStorage para sobrevivir navegaciones internas.
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
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'session-user';

function readSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSession);
  const { loadPrefs } = useAccessibility();

  const login = useCallback(
    (u: User) => {
      // Persistir en sessionStorage ANTES de setUser para que cualquier
      // componente que monte inmediatamente después ya lo pueda leer
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      } catch { /* noop */ }
      setUser(u);
      loadPrefs(u.accessibilityPreferences);
    },
    [loadPrefs]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
