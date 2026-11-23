import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useOptionalAuth } from '../../app/AuthContext';
import {
  ALL_TOOLS,
  CATALOG_KIND_LABELS,
  TOOL_DESCRIPTIONS,
  TOOL_LABELS,
  catalogKindForUser,
  needsForUser,
  needsLabel,
  recommendedToolsForNeeds,
  type AccessibilityTool,
} from '../../services/identity';
import type { AccessibilityPreferences } from '../../types/accessibility';
import styles from './AccessibilityButton.module.css';

const SCALE_LABELS: Record<AccessibilityPreferences['textScale'], string> = {
  1: '100 %', 1.25: '125 %', 1.5: '150 %', 1.75: '175 %', 2: '200 %',
};

export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { prefs, updatePref, resetPrefs, increaseText, decreaseText, announce } = useAccessibility();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const panelId = useId();

  const needs = needsForUser(user);
  const recommended = recommendedToolsForNeeds(needs);
  const catalogKind = catalogKindForUser(user);

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else btnRef.current?.focus();
  }, [open]);

  const handleFocusTrap = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((element) => !element.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const change = useCallback((tool: AccessibilityTool, value: boolean | string) => {
    updatePref(tool as keyof AccessibilityPreferences, value as never);
    announce(`${TOOL_LABELS[tool]} ${typeof value === 'boolean' ? (value ? 'activado' : 'desactivado') : 'actualizado'}.`);
  }, [updatePref, announce]);

  const isActive = (tool: AccessibilityTool) => {
    if (tool === 'textScale') return prefs.textScale > 1;
    if (tool === 'colorMode') return prefs.colorMode !== 'normal';
    return prefs[tool];
  };

  const toolControl = (tool: AccessibilityTool, suggested: boolean) => {
    if (tool === 'textScale') {
      return (
        <ScaleControl
          key="scale" suggested={suggested} value={SCALE_LABELS[prefs.textScale]}
          onDecrease={() => { decreaseText(); announce(`Texto al ${SCALE_LABELS[prefs.textScale]}`); }}
          onIncrease={() => { increaseText(); announce(`Texto al ${SCALE_LABELS[prefs.textScale]}`); }}
        />
      );
    }
    if (tool === 'colorMode') {
      return (
        <div className={styles.row} key={tool}>
          <div className={styles.rowLabel}>
            {TOOL_LABELS[tool]}
            <span className={styles.rowDesc}>{TOOL_DESCRIPTIONS[tool]}</span>
          </div>
          <select id="pref-color-mode" className={styles.select} value={prefs.colorMode}
            aria-label="Opciones de color"
            onChange={(event) => change(tool, event.target.value)}>
            <option value="normal">Normales</option>
            <option value="blue-yellow">Azul y amarillo</option>
          </select>
        </div>
      );
    }
    return (
      <ToggleRow
        key={tool} id={`pref-${tool}`} label={TOOL_LABELS[tool]}
        description={TOOL_DESCRIPTIONS[tool]} recommended={suggested} active={isActive(tool)}
        checked={isActive(tool)} onChange={(value) => change(tool, value)}
      />
    );
  };

  return (
    <>
      <button ref={btnRef} className={styles.fab} aria-label="Opciones de accesibilidad"
        aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        <AccessibilityIcon aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} ref={panelRef} role="dialog" aria-modal="true"
          aria-label="Menú de accesibilidad" tabIndex={-1} className={styles.panel}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
            handleFocusTrap(event);
          }}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Accesibilidad</h2>
              <p className={styles.panelSubtitle}>
                {user ? `Perfil: ${needsLabel(needs)} · ${CATALOG_KIND_LABELS[catalogKind]}` : 'Configura tu experiencia antes de entrar'}
              </p>
            </div>
            <button className={`btn btn-ghost ${styles.closeBtn}`}
              aria-label="Cerrar menú de accesibilidad" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className={styles.panelBody}>
            <h3 className={styles.sectionTitle}>Mi configuración personalizada</h3>
            {recommended.length ? (
              <>
                <p className={styles.sectionHint}>Herramientas recomendadas para tus necesidades.</p>
                {recommended.map((tool) => toolControl(tool, true))}
              </>
            ) : (
              <p className={styles.sectionHint}>
                No has declarado necesidades. Puedes activar cualquier herramienta en «Otras opciones».
              </p>
            )}

            <h3 className={styles.sectionTitle}>Otras opciones de accesibilidad</h3>
            <p className={styles.sectionHint}>Puedes combinarlas con tus recomendaciones.</p>
            {ALL_TOOLS.filter((tool) => !recommended.includes(tool)).map((tool) => toolControl(tool, false))}
          </div>
          <div className={styles.panelFooter}>
            <button className="btn btn-ghost" onClick={() => {
              resetPrefs();
              announce('Preferencias restablecidas a valores predeterminados.');
            }}>
              Restablecer configuración
            </button>
            <p className={styles.footerNote}>Los cambios se guardan automáticamente en tu perfil.</p>
          </div>
        </div>
      )}
    </>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  active: boolean;
  recommended: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ id, label, description, checked, active, recommended, onChange }: ToggleRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span className={styles.labelLine}>
          {label}
          {recommended && <span className={styles.badge}>Recomendada</span>}
          {active && <span className={styles.activeBadge}>Activa</span>}
        </span>
        <span className={styles.rowDesc}>{description}</span>
      </div>
      <button id={id} role="switch" aria-checked={checked} aria-label={label}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}>
        <span className="sr-only">{checked ? 'Activado' : 'Desactivado'}</span>
        <span className={styles.toggleThumb} aria-hidden="true" />
      </button>
    </div>
  );
}

function ScaleControl({ value, onDecrease, onIncrease, suggested }: {
  value: string; onDecrease: () => void; onIncrease: () => void; suggested: boolean;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span className={styles.labelLine}>
          Aumentar o reducir texto
          {suggested && <span className={styles.badge}>Recomendada</span>}
        </span>
        <span className={styles.rowDesc}>Tamaño actual: {value}. Hasta 200 %.</span>
      </div>
      <div className={styles.stepper} role="group" aria-label="Tamaño del texto">
        <button className="btn btn-secondary" onClick={onDecrease} aria-label="Reducir texto">−</button>
        <output aria-live="polite">{value}</output>
        <button className="btn btn-secondary" onClick={onIncrease} aria-label="Aumentar texto">+</button>
      </div>
    </div>
  );
}

function AccessibilityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      width="30" height="30" {...props}>
      <circle cx="12" cy="3.5" r="2" />
      <path d="M19 7.5H5a1 1 0 0 0 0 2h4.5l-1.6 7.2-2.9 3.3a1 1 0 1 0 1.5 1.3l3-3.4a1 1 0 0 0 .2-.4l.8-3.5h2l.8 3.5a1 1 0 0 0 .2.4l3 3.4a1 1 0 1 0 1.5-1.3l-2.9-3.3-1.6-7.2H19a1 1 0 0 0 0-2z" />
    </svg>
  );
}
