/**
 * UserRegistryContext – registro persistente de todos los usuarios registrados.
 * - Persiste en localStorage bajo la clave 'user-registry'.
 * - Si no hay datos reales, carga usuarios de demostración para el admin.
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
import { DEFAULT_PREFERENCES } from '../types/accessibility';

const STORAGE_KEY = 'user-registry';

// ── Usuarios de demostración (siempre visibles en el panel admin) ────────────
const DEMO_USERS: User[] = [
  {
    id: 'demo-1',
    name: 'María García',
    email: 'maria@ejemplo.com',
    role: 'user',
    disability: 'visual',
    disabilityConsent: true,
    registeredAt: '2026-11-01T10:30:00.000Z',
    accessibilityPreferences: {
      ...DEFAULT_PREFERENCES,
      highContrast: true,
      textScale: 1.5,
    },
  },
  {
    id: 'demo-2',
    name: 'Carlos López',
    email: 'carlos@ejemplo.com',
    role: 'user',
    disability: 'auditiva',
    disabilityConsent: true,
    registeredAt: '2026-11-05T14:20:00.000Z',
    accessibilityPreferences: {
      ...DEFAULT_PREFERENCES,
      captions: true,
      signLanguage: true,
      visualAlerts: true,
    },
  },
  {
    id: 'demo-3',
    name: 'Ana Martínez',
    email: 'ana@ejemplo.com',
    role: 'user',
    disability: 'motriz',
    disabilityConsent: true,
    registeredAt: '2026-11-10T09:15:00.000Z',
    accessibilityPreferences: {
      ...DEFAULT_PREFERENCES,
      largeButtons: true,
      textScale: 1.25,
    },
  },
  {
    id: 'demo-4',
    name: 'Pedro Sánchez',
    email: 'pedro@ejemplo.com',
    role: 'user',
    disability: 'cognitiva',
    disabilityConsent: true,
    registeredAt: '2026-11-12T16:45:00.000Z',
    accessibilityPreferences: {
      ...DEFAULT_PREFERENCES,
      simpleLanguage: true,
      largeButtons: true,
    },
  },
  {
    id: 'demo-5',
    name: 'Laura Fernández',
    email: 'laura@ejemplo.com',
    role: 'user',
    disability: null,
    disabilityConsent: false,
    registeredAt: '2026-11-15T11:00:00.000Z',
    accessibilityPreferences: DEFAULT_PREFERENCES,
  },
];

// ── Lectura del storage ──────────────────────────────────────────────────────

function readRegistry(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEMO_USERS;
    const parsed = JSON.parse(raw) as User[];
    // Validar que son datos del formato nuevo (tienen 'role')
    if (!Array.isArray(parsed) || parsed.length === 0 || !('role' in parsed[0])) {
      // Datos viejos o vacíos: limpiar y usar demos
      localStorage.removeItem(STORAGE_KEY);
      return DEMO_USERS;
    }
    return parsed;
  } catch {
    return DEMO_USERS;
  }
}

// ── Contexto ─────────────────────────────────────────────────────────────────

interface UserRegistryContextValue {
  users: User[];
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
}

const UserRegistryContext = createContext<UserRegistryContextValue | null>(null);

export function UserRegistryProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(readRegistry);

  const addUser = useCallback((user: User) => {
    setUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      const next = [...prev, user];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* storage lleno */ }
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
