import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PREFERENCES, type AccessibilityPreferences } from '../types/accessibility';
import { safeStorage, STORAGE_KEYS } from '../services/storage';

type Scale = AccessibilityPreferences['textScale'];
const SCALES: Scale[] = [1, 1.25, 1.5, 1.75, 2];

interface AccessibilityContextValue {
  prefs: AccessibilityPreferences;
  updatePref: <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => void;
  applyPrefs: (next: AccessibilityPreferences) => void;
  resetPrefs: () => void;
  increaseText: () => void;
  decreaseText: () => void;
  loadPrefs: (saved: AccessibilityPreferences) => void;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function readPrefs(): AccessibilityPreferences {
  return { ...DEFAULT_PREFERENCES, ...safeStorage.get<Partial<AccessibilityPreferences>>(STORAGE_KEYS.preferences, {}) };
}

function applyToDOM(prefs: AccessibilityPreferences) {
  const root = document.documentElement;
  root.classList.toggle('high-contrast', prefs.highContrast);
  root.classList.toggle('large-buttons', prefs.largeButtons);
  root.classList.toggle('simple-language', prefs.simpleLanguage);
  root.classList.toggle('extra-spacing', prefs.extraSpacing);
  root.classList.toggle('keyboard-navigation', prefs.keyboardNavigation);
  root.classList.toggle('visual-alerts', prefs.visualAlerts);
  root.classList.toggle('blue-yellow', prefs.colorMode === 'blue-yellow');
  root.style.setProperty('--text-scale', String(prefs.textScale));
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(readPrefs);

  useEffect(() => {
    applyToDOM(prefs);
    safeStorage.set(STORAGE_KEYS.preferences, prefs);
  }, [prefs]);

  const updatePref = useCallback(
    <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const applyPrefs = useCallback((next: AccessibilityPreferences) => {
    setPrefs({ ...DEFAULT_PREFERENCES, ...next });
  }, []);

  const resetPrefs = useCallback(() => setPrefs({ ...DEFAULT_PREFERENCES }), []);

  const changeScale = useCallback((direction: 1 | -1) => {
    setPrefs((prev) => {
      const index = SCALES.indexOf(prev.textScale);
      const nextIndex = Math.min(SCALES.length - 1, Math.max(0, index + direction));
      return { ...prev, textScale: SCALES[nextIndex] };
    });
  }, []);

  const increaseText = useCallback(() => changeScale(1), [changeScale]);
  const decreaseText = useCallback(() => changeScale(-1), [changeScale]);
  const loadPrefs = useCallback((saved: AccessibilityPreferences) => {
    setPrefs({ ...DEFAULT_PREFERENCES, ...saved });
  }, []);

  const announce = useCallback((message: string) => {
    let region = document.getElementById('live-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'live-region';
      region.className = 'sr-only';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }, []);

  const value = useMemo(
    () => ({ prefs, updatePref, applyPrefs, resetPrefs, increaseText, decreaseText, loadPrefs, announce }),
    [prefs, updatePref, applyPrefs, resetPrefs, increaseText, decreaseText, loadPrefs, announce]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}
