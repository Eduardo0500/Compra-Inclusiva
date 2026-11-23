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
import type { DisabilityType, User } from '../types/user';
import { DEFAULT_PREFERENCES } from '../types/accessibility';

const STORAGE_KEY = 'user-registry';

// ── Usuarios de demostración (siempre visibles en el panel admin) ────────────
const DEMO_USERS: User[] = [
  {
    id: 'demo-1',
    name: 'María García',
    email: 'maria@ejemplo.com',
    role: 'user',
    disabilities: ['visual'],
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
    disabilities: ['auditiva'],
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
    disabilities: ['motriz'],
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
    disabilities: ['cognitiva'],
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
    disabilities: ['no_indica'],
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
    const parsed = JSON.parse(raw) as Array<User & { disability?: DisabilityType | null }>;
    if (!Array.isArray(parsed)) return DEMO_USERS;
    const migrated = parsed.map((u) => {
      if (Array.isArray(u.disabilities) && u.disabilities.length) return u;
      const disabilities: DisabilityType[] =
        u.disability && u.disability !== 'ninguna'
          ? [u.disability]
          : u.disability === 'ninguna'
            ? ['ninguna']
            : ['no_indica'];
      return { ...u, disabilities };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return DEMO_USERS;
  }
}

// ── Contexto ─────────────────────────────────────────────────────────────────

interface UserRegistryContextValue {
  users: User[];
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
  updateUser: (user: User) => void;
  registerUser: (user: User, password: string) => Promise<User>;
  authenticate: (email: string, password: string) => Promise<User | null>;
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

  const updateUser = useCallback((user: User) => {
    setUsers((prev) => {
      const next = prev.map((item) => item.id === user.id ? user : item);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* storage lleno */ }
      return next;
    });
  }, []);

  const registerUser = useCallback(async (user: User, password: string) => {
    const passwordHash = await hashPassword(password);
    const registered = { ...user, passwordHash, cart: {}, orders: [] };
    if (users.some((item) => item.email.toLowerCase() === registered.email.toLowerCase())) {
      throw new Error('Este correo ya tiene una cuenta.');
    }
    const next = [...users, registered];
    setUsers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error('No se pudo guardar la cuenta en este navegador. Revisa el almacenamiento disponible.');
    }
    return registered;
  }, [users]);

  const authenticate = useCallback(async (email: string, password: string) => {
    const passwordHash = await hashPassword(password);
    const found = users.find((item) =>
      item.email.toLowerCase() === email.trim().toLowerCase()
      && item.passwordHash === passwordHash
    );
    if (!found) return null;
    const disabilities: DisabilityType[] = Array.isArray(found.disabilities) && found.disabilities.length
      ? found.disabilities
      : found.disability
        ? [found.disability]
        : ['no_indica'];
    return {
      ...found,
      disabilities,
      accessibilityPreferences: {
        ...DEFAULT_PREFERENCES,
        ...found.accessibilityPreferences,
      },
    };
  }, [users]);

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
    () => ({ users, addUser, removeUser, updateUser, registerUser, authenticate }),
    [users, addUser, removeUser, updateUser, registerUser, authenticate]
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

async function hashPassword(password: string): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(`compra-inclusiva-demo:${password}`);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Continuar con el respaldo cuando SubtleCrypto no esté disponible.
  }
  return `demo-${password.length}-${password.split('').reverse().join('').length}`;
}
