/**
 * AccessibilityContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Fuente única de verdad para las preferencias de accesibilidad.
 * - Persiste en localStorage (clave "a11y-prefs").
 * - Aplica las clases CSS y variables CSS en <html> para que toda la app reaccione.
 * - Expone announce() para cumplir WCAG 4.1.3 sin mover el foco.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_PREFERENCES,
  type AccessibilityPreferences,
} from '../types/accessibility';

interface AccessibilityContextValue {
  prefs: AccessibilityPreferences;
  updatePref: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  resetPrefs: () => void;
  /** Carga preferencias desde el perfil guardado (se llama al hacer login) */
  loadPrefs: (saved: AccessibilityPreferences) => void;
  /** Anuncia un mensaje a lectores de pantalla sin mover el foco (WCAG 4.1.3) */
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const STORAGE_KEY = 'a11y-prefs';

function readStorage(): AccessibilityPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function applyToDOM(prefs: AccessibilityPreferences) {
  const root = document.documentElement;
  root.classList.toggle('high-contrast', prefs.highContrast);
  root.classList.toggle('large-buttons', prefs.largeButtons);
  root.classList.toggle('simple-language', prefs.simpleLanguage);
  root.style.setProperty('--text-scale', String(prefs.textScale));
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(readStorage);

  // Aplicar al DOM cada vez que cambien las preferencias
  useEffect(() => {
    applyToDOM(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const updatePref = useCallback(
    <K extends keyof AccessibilityPreferences>(
      key: K,
      value: AccessibilityPreferences[K]
    ) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFERENCES);
  }, []);

  const loadPrefs = useCallback((saved: AccessibilityPreferences) => {
    setPrefs(saved);
  }, []);

  const announce = useCallback((message: string) => {
    const region = document.getElementById('live-region');
    if (!region) return;
    // Limpiar primero para que el lector anuncie incluso el mismo texto dos veces
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }, []);

  const value = useMemo(
    () => ({ prefs, updatePref, resetPrefs, loadPrefs, announce }),
    [prefs, updatePref, resetPrefs, loadPrefs, announce]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}
