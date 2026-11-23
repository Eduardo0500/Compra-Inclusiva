import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PREFERENCES } from '../types/accessibility';
import type { DisabilityType, User } from '../types/user';
import { DEMO_PASSWORD_HASH, hashPassword, verifyPassword } from '../services/password';
import { safeStorage, STORAGE_KEYS } from '../services/storage';

const DEMO_USERS: User[] = [
  {
    id: 'demo-1', name: 'María García', email: 'maria@ejemplo.com', role: 'user',
    disabilities: ['visual'], disabilityConsent: true,
    registeredAt: '2026-11-01T10:30:00.000Z',
    accessibilityPreferences: { ...DEFAULT_PREFERENCES, highContrast: true, textScale: 1.5, readContent: true, keyboardNavigation: true },
    passwordHash: DEMO_PASSWORD_HASH, cart: {}, orders: [],
  },
  {
    id: 'demo-2', name: 'Carlos López', email: 'carlos@ejemplo.com', role: 'user',
    disabilities: ['auditiva'], disabilityConsent: true,
    registeredAt: '2026-11-05T14:20:00.000Z',
    accessibilityPreferences: { ...DEFAULT_PREFERENCES, captions: true, signLanguage: true, visualAlerts: true },
    passwordHash: DEMO_PASSWORD_HASH, cart: {}, orders: [],
  },
  {
    id: 'demo-3', name: 'Ana Martínez', email: 'ana@ejemplo.com', role: 'user',
    disabilities: ['motriz'], disabilityConsent: true,
    registeredAt: '2026-11-10T09:15:00.000Z',
    accessibilityPreferences: { ...DEFAULT_PREFERENCES, largeButtons: true, extraSpacing: true, keyboardNavigation: true },
    passwordHash: DEMO_PASSWORD_HASH, cart: {}, orders: [],
  },
  {
    id: 'demo-4', name: 'Pedro Sánchez', email: 'pedro@ejemplo.com', role: 'user',
    disabilities: ['cognitiva'], disabilityConsent: true,
    registeredAt: '2026-11-12T16:45:00.000Z',
    accessibilityPreferences: { ...DEFAULT_PREFERENCES, simpleLanguage: true, extraSpacing: true, keyboardNavigation: true },
    passwordHash: DEMO_PASSWORD_HASH, cart: {}, orders: [],
  },
  {
    id: 'demo-5', name: 'Laura Fernández', email: 'laura@ejemplo.com', role: 'user',
    disabilities: ['no_indica'], disabilityConsent: false,
    registeredAt: '2026-11-15T11:00:00.000Z',
    accessibilityPreferences: DEFAULT_PREFERENCES,
    passwordHash: DEMO_PASSWORD_HASH, cart: {}, orders: [],
  },
  {
    id: 'demo-6', name: 'Elena Ruiz', email: 'elena@ejemplo.com', role: 'user',
    disabilities: ['visual', 'motriz'], disabilityConsent: true,
    registeredAt: '2026-11-18T08:00:00.000Z',
    accessibilityPreferences: {
      ...DEFAULT_PREFERENCES, highContrast: true, textScale: 1.5, readContent: true,
      keyboardNavigation: true, largeButtons: true, extraSpacing: true,
    },
    passwordHash: DEMO_PASSWORD_HASH, cart: {}, orders: [],
  },
];

function normalizeDisabilities(user: User): User {
  const declared = Array.isArray(user.disabilities) && user.disabilities.length
    ? user.disabilities
    : user.disability
      ? [user.disability]
      : (['no_indica'] as DisabilityType[]);
  return {
    ...user,
    disabilities: declared,
    accessibilityPreferences: { ...DEFAULT_PREFERENCES, ...user.accessibilityPreferences },
    cart: user.cart ?? {},
    orders: user.orders ?? [],
  };
}

function readRegistry(): User[] {
  const stored = safeStorage.get<User[]>(STORAGE_KEYS.users, []);
  const byId = new Map<string, User>();
  DEMO_USERS.forEach((demo) => byId.set(demo.id, demo));
  stored.forEach((user) => byId.set(user.id, user));
  const migrated = [...byId.values()].map((user) => {
    const normalized = normalizeDisabilities(user);
    return DEMO_USERS.some((demo) => demo.id === user.id) && !normalized.passwordHash
      ? { ...normalized, passwordHash: DEMO_PASSWORD_HASH }
      : normalized;
  });
  safeStorage.set(STORAGE_KEYS.users, migrated);
  return migrated;
}

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

  const persist = useCallback((next: User[]) => {
    safeStorage.set(STORAGE_KEYS.users, next);
    setUsers(next);
  }, []);

  const addUser = useCallback((user: User) => {
    setUsers((prev) => {
      if (prev.some((item) => item.id === user.id)) return prev;
      const next = [...prev, normalizeDisabilities(user)];
      safeStorage.set(STORAGE_KEYS.users, next);
      return next;
    });
  }, []);

  const updateUser = useCallback((user: User) => {
    setUsers((prev) => {
      const next = prev.map((item) => item.id === user.id ? normalizeDisabilities(user) : item);
      safeStorage.set(STORAGE_KEYS.users, next);
      return next;
    });
  }, []);

  const registerUser = useCallback(async (user: User, password: string) => {
    if (users.some((item) => item.email.toLocaleLowerCase('es') === user.email.trim().toLocaleLowerCase('es'))) {
      throw new Error('Este correo ya tiene una cuenta.');
    }
    const registered = normalizeDisabilities({
      ...user,
      id: user.id || `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      email: user.email.trim(),
      passwordHash: await hashPassword(password),
      cart: {},
      orders: [],
      registeredAt: user.registeredAt ?? new Date().toISOString(),
    });
    persist([...users, registered]);
    return registered;
  }, [users, persist]);

  const authenticate = useCallback(async (email: string, password: string) => {
    const found = users.find((item) => item.email.toLocaleLowerCase('es') === email.trim().toLocaleLowerCase('es'));
    if (!found || !(await verifyPassword(password, found.passwordHash))) return null;
    return normalizeDisabilities(found);
  }, [users]);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => {
      const next = prev.filter((user) => user.id !== id);
      safeStorage.set(STORAGE_KEYS.users, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ users, addUser, removeUser, updateUser, registerUser, authenticate }),
    [users, addUser, removeUser, updateUser, registerUser, authenticate]
  );

  return <UserRegistryContext.Provider value={value}>{children}</UserRegistryContext.Provider>;
}

export function useUserRegistry(): UserRegistryContextValue {
  const ctx = useContext(UserRegistryContext);
  if (!ctx) throw new Error('useUserRegistry must be used inside UserRegistryProvider');
  return ctx;
}
