import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_PREFERENCES } from '../types/accessibility';
import type { User } from '../types/user';
import { useAccessibility } from './AccessibilityContext';
import { useUserRegistry } from './UserRegistryContext';
import { safeSession, STORAGE_KEYS } from '../services/storage';

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessionUserId(): string | null {
  return safeSession.get<string | null>(STORAGE_KEYS.sessionUserId, null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(readSessionUserId);
  const { users, addUser, updateUser: updateRegistryUser } = useUserRegistry();
  const { loadPrefs, prefs } = useAccessibility();
  const syncedPrefs = useRef<string>('');
  const initialised = useRef(false);

  const user = useMemo(() => users.find((item) => item.id === userId) ?? null, [users, userId]);

  const applyUserPrefs = useCallback((next: User) => {
    const saved = { ...DEFAULT_PREFERENCES, ...next.accessibilityPreferences };
    syncedPrefs.current = JSON.stringify(saved);
    loadPrefs(saved);
  }, [loadPrefs]);

  const login = useCallback((next: User) => {
    if (!users.some((item) => item.id === next.id)) addUser(next);
    safeSession.set(STORAGE_KEYS.sessionUserId, next.id);
    setUserId(next.id);
    applyUserPrefs(next);
  }, [users, addUser, applyUserPrefs]);

  const logout = useCallback(() => {
    safeSession.remove(STORAGE_KEYS.sessionUserId);
    setUserId(null);
    syncedPrefs.current = '';
    loadPrefs(DEFAULT_PREFERENCES);
  }, [loadPrefs]);

  const updateUser = useCallback((next: User) => {
    updateRegistryUser(next);
    applyUserPrefs(next);
  }, [updateRegistryUser, applyUserPrefs]);

  useEffect(() => {
    if (!user || initialised.current) return;
    initialised.current = true;
    syncedPrefs.current = JSON.stringify(prefs);
    loadPrefs({ ...DEFAULT_PREFERENCES, ...user.accessibilityPreferences });
  }, [user, prefs, loadPrefs]);

  useEffect(() => {
    if (!user || !initialised.current) return;
    const current = JSON.stringify(prefs);
    if (current === syncedPrefs.current) return;
    syncedPrefs.current = current;
    updateRegistryUser({ ...user, accessibilityPreferences: prefs });
  }, [prefs, user, updateRegistryUser]);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: user !== null, isAdmin: user?.role === 'admin', updateUser }),
    [user, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
