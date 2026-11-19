/**
 * AccessibilityButton + AccessibilityPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Botón circular flotante con el icono universal de accesibilidad (WCAG 3.2.6).
 * El panel cumple:
 *   - Foco devuelto al botón al cerrar (WCAG 2.4.3)
 *   - Cierre con Esc (WCAG 2.1.1)
 *   - No oculta el elemento enfocado (WCAG 2.4.11)
 *   - Cada cambio se anuncia sin mover el foco (WCAG 4.1.3)
 */
import {
  useEffect,
  useRef,
  useState,
  useId,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import type { AccessibilityPreferences } from '../../types/accessibility';
import styles from './AccessibilityButton.module.css';

type Scale = AccessibilityPreferences['textScale'];
const SCALES: Scale[] = [1, 1.25, 1.5, 1.75, 2];
const SCALE_LABELS: Record<Scale, string> = {
  1: '100 %',
  1.25: '125 %',
  1.5: '150 %',
  1.75: '175 %',
  2: '200 %',
};

export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { prefs, updatePref, resetPrefs, announce } = useAccessibility();
  const panelId = useId();

  // Devolver foco al botón al cerrar (WCAG 2.4.3)
  useEffect(() => {
    if (!open) {
      btnRef.current?.focus();
    } else {
      // Mover foco al panel para que el lector lo anuncie
      panelRef.current?.focus();
    }
  }, [open]);

  // Cerrar con Esc (WCAG 2.1.1)
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Focus trap: confina el teclado dentro del panel mientras está abierto (WCAG 2.1.2)
  const handleFocusTrap = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  function toggle<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K],
    label: string
  ) {
    updatePref(key, value);
    announce(label);
  }

  function handleReset() {
    resetPrefs();
    announce('Preferencias de accesibilidad restablecidas');
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        ref={btnRef}
        className={styles.fab}
        aria-label="Opciones de accesibilidad"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Icono universal de accesibilidad (SVG inline para que herede color) */}
        <AccessibilityIcon aria-hidden="true" />
      </button>

      {/* Panel */}
      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de accesibilidad"
          tabIndex={-1}
          className={styles.panel}
          onKeyDown={(e) => { handleKeyDown(e); handleFocusTrap(e); }}
        >
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Accesibilidad</h2>
            <button
              className={`btn btn-ghost ${styles.closeBtn}`}
              aria-label="Cerrar menú de accesibilidad"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.panelBody}>
            {/* 1. Alto contraste (WCAG 1.4.3) */}
            <ToggleRow
              id="pref-contrast"
              label="Alto contraste"
              description="Texto blanco sobre negro para mayor legibilidad"
              checked={prefs.highContrast}
              onChange={(v) =>
                toggle('highContrast', v, v ? 'Alto contraste activado' : 'Alto contraste desactivado')
              }
            />

            {/* 2. Tamaño de texto (WCAG 1.4.4) */}
            <div className={styles.row}>
              <label htmlFor="pref-text-scale" className={styles.rowLabel}>
                Tamaño de texto
                <span className={styles.rowDesc}>Hasta 200 % sin perder contenido</span>
              </label>
              <select
                id="pref-text-scale"
                value={prefs.textScale}
                className={styles.select}
                onChange={(e) => {
                  const v = Number(e.target.value) as Scale;
                  toggle('textScale', v, `Texto al ${SCALE_LABELS[v]}`);
                }}
                aria-label={`Tamaño de texto: ${SCALE_LABELS[prefs.textScale]}`}
              >
                {SCALES.map((s) => (
                  <option key={s} value={s}>
                    {SCALE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Botones grandes (WCAG 2.5.8) */}
            <ToggleRow
              id="pref-large-buttons"
              label="Botones grandes"
              description="Área de toque mínima 56 × 56 px"
              checked={prefs.largeButtons}
              onChange={(v) =>
                toggle('largeButtons', v, v ? 'Botones grandes activados' : 'Botones grandes desactivados')
              }
            />

            {/* 4. Subtítulos (WCAG 1.2.2 / 1.2.4) */}
            <ToggleRow
              id="pref-captions"
              label="Subtítulos"
              description="Activados en videos y videollamadas"
              checked={prefs.captions}
              onChange={(v) =>
                toggle('captions', v, v ? 'Subtítulos activados' : 'Subtítulos desactivados')
              }
            />

            {/* 5. Lengua de señas (WCAG 1.2.6) */}
            <ToggleRow
              id="pref-sign-language"
              label="Lengua de señas"
              description="Muestra intérprete en videos y videollamadas"
              checked={prefs.signLanguage}
              onChange={(v) =>
                toggle('signLanguage', v, v ? 'Lengua de señas activada' : 'Lengua de señas desactivada')
              }
            />

            {/* 6. Alertas visuales y vibración (WCAG 1.3.3 / 1.4.1) */}
            <ToggleRow
              id="pref-visual-alerts"
              label="Alertas visuales y vibración"
              description="Complementa las alertas sonoras con parpadeo y vibración"
              checked={prefs.visualAlerts}
              onChange={(v) =>
                toggle('visualAlerts', v, v ? 'Alertas visuales activadas' : 'Alertas visuales desactivadas')
              }
            />

            {/* 7. Lenguaje simple (WCAG 3.1.5) */}
            <ToggleRow
              id="pref-simple-language"
              label="Lenguaje simple"
              description="Textos con frases cortas y vocabulario cotidiano"
              checked={prefs.simpleLanguage}
              onChange={(v) =>
                toggle('simpleLanguage', v, v ? 'Lenguaje simple activado' : 'Lenguaje simple desactivado')
              }
            />
          </div>

          {/* Restablecer */}
          <div className={styles.panelFooter}>
            <button className="btn btn-ghost" onClick={handleReset}>
              Restablecer valores predeterminados
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Subcomponentes ── */

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        {label}
        <span className={styles.rowDesc}>{description}</span>
      </div>
      {/* switch accesible con role="switch" (WCAG 4.1.2) */}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
        aria-label={label}
      >
        <span className="sr-only">{checked ? 'Activado' : 'Desactivado'}</span>
        <span className={styles.toggleThumb} aria-hidden="true" />
      </button>
    </div>
  );
}

function AccessibilityIcon({ ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="28"
      height="28"
      {...props}
    >
      {/* Icono estándar de accesibilidad ISA */}
      <circle cx="12" cy="3.5" r="2" />
      <path d="M19 7.5H5a1 1 0 0 0 0 2h4.5l-1.6 7.2-2.9 3.3a1 1 0 1 0 1.5 1.3l3-3.4a1 1 0 0 0 .2-.4l.8-3.5h2l.8 3.5a1 1 0 0 0 .2.4l3 3.4a1 1 0 1 0 1.5-1.3l-2.9-3.3-1.6-7.2H19a1 1 0 0 0 0-2z" />
    </svg>
  );
}
