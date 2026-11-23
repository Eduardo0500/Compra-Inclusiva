const PREFIX = 'compra-facil:';
const LEGACY_KEYS: Record<string, string> = {
  'user-registry': 'user-registry',
  'shop-orders': 'shop-orders',
  'a11y-prefs': 'a11y-prefs',
  'session-user-id': 'session-user',
};

export const STORAGE_KEYS = {
  users: 'user-registry',
  orders: 'shop-orders',
  preferences: 'a11y-prefs',
  sessionUserId: 'session-user-id',
} as const;

function parseId(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as string | { id?: string } | null;
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object' && typeof parsed.id === 'string') return parsed.id;
  } catch {
    if (/^[\w-]+$/.test(raw)) return raw;
  }
  return null;
}

function migrateLegacySession(): string | null {
  for (const store of [sessionStorage, localStorage]) {
    const raw = store.getItem('session-user');
    if (!raw) continue;
    const id = parseId(raw);
    if (!id) continue;
    try {
      sessionStorage.setItem(PREFIX + STORAGE_KEYS.sessionUserId, JSON.stringify(id));
      localStorage.setItem(PREFIX + STORAGE_KEYS.sessionUserId, JSON.stringify(id));
      sessionStorage.removeItem('session-user');
      localStorage.removeItem('session-user');
    } catch {
      /* almacenamiento no disponible */
    }
    return id;
  }
  return null;
}

function migrate(key: string): void {
  const legacy = LEGACY_KEYS[key];
  if (!legacy) return;
  try {
    const raw = localStorage.getItem(legacy) ?? sessionStorage.getItem(legacy);
    if (raw === null) return;
    if (key === STORAGE_KEYS.sessionUserId) {
      migrateLegacySession();
      return;
    }
    localStorage.setItem(PREFIX + key, raw);
    localStorage.removeItem(legacy);
    sessionStorage.removeItem(legacy);
  } catch {
    /* almacenamiento no disponible */
  }
}

export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      if (localStorage.getItem(PREFIX + key) === null) migrate(key);
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* almacenamiento no disponible */
    }
  },
};

export const safeSession = {
  get<T>(key: string, fallback: T): T {
    try {
      if (key === STORAGE_KEYS.sessionUserId && sessionStorage.getItem(PREFIX + key) === null) {
        const migrated = migrateLegacySession();
        if (migrated !== null) return migrated as T;
      }
      const raw = sessionStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* almacenamiento no disponible */
    }
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(PREFIX + key);
    } catch {
      /* almacenamiento no disponible */
    }
  },
};
