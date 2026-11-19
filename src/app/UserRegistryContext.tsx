/**
 * UserRegistryContext – registro en memoria de todos los usuarios registrados.
 * El administrador usa este contexto para listar usuarios y sus perfiles.
 * Los datos persisten en localStorage bajo la clave 'user-registry'.
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

interface UserRegistryContextValue {
  users: User[];
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
}

const UserRegistryContext = createContext<UserRegistryContextValue | null>(null);

const STORAGE_KEY = 'user-registry';

function readRegistry(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

export function UserRegistryProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(readRegistry);

  const addUser = useCallback((user: User) => {
    // No duplicar si ya existe (mismo id)
    setUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      const next = [...prev, user];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage lleno – continúa sin persistir */
      }
      return next;
    });
  }, []);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* noop */ }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ users, addUser, removeUser }),
    [users, addUser, removeUser]
  );

  return (
    <UserRegistryContext.Provider value={value}>
      {children}
    </UserRegistryContext.Provider>
  );
}

export function useUserRegistry(): UserRegistryContextValue {
  const ctx = useContext(UserRegistryContext);
  if (!ctx) throw new Error('useUserRegistry must be used inside UserRegistryProvider');
  return ctx;
}
