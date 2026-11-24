import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type SVGProps } from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { safeStorage, STORAGE_KEYS } from '../../services/storage';
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

const SCALE_VALUES: AccessibilityPreferences['textScale'][] = [1, 1.25, 1.5, 1.75, 2];
const SCALE_LABELS: Record<AccessibilityPreferences['textScale'], string> = {
  1: '100 %', 1.25: '125 %', 1.5: '150 %', 1.75: '175 %', 2: '200 %',
};
const TOOL_ICONS: Record<AccessibilityTool, string> = {
  highContrast: '◐',
  textScale: 'Aa',
  largeButtons: '▣',
  captions: 'CC',
  signLanguage: 'SL',
  visualAlerts: '!',
  simpleLanguage: '≡',
  extraSpacing: '↕',
  readContent: '▶',
  keyboardNavigation: 'KB',
  colorMode: '◧',
};

const MARGIN = 16;
const FAB_SIZE = 60;
const MOVE_STEP = 24;

interface Position { x: number; y: number }
interface Viewport { width: number; height: number }
interface DragState { pointerId: number; startX: number; startY: number; x: number; y: number }

function readViewport(): Viewport {
  return {
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 800 : window.innerHeight,
  };
}

function defaultPosition(viewport: Viewport): Position {
  return {
    x: Math.max(MARGIN, viewport.width - FAB_SIZE - MARGIN),
    y: Math.max(MARGIN, viewport.height - FAB_SIZE - MARGIN),
  };
}

function clampPosition(position: Position, viewport: Viewport, size = FAB_SIZE): Position {
  const maxX = Math.max(MARGIN, viewport.width - size - MARGIN);
  const maxY = Math.max(MARGIN, viewport.height - size - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, position.x), maxX),
    y: Math.min(Math.max(MARGIN, position.y), maxY),
  };
}

function readSavedPosition(): Position | null {
  const saved = safeStorage.get<Position | null>(STORAGE_KEYS.a11yPosition, null);
  if (!saved || !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return null;
  return saved;
}

export function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(readSavedPosition);
  const [viewport, setViewport] = useState<Viewport>(readViewport);
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const panelId = useId();
  const searchId = `${panelId}-search`;
  const { prefs, updatePref, resetPrefs, announce } = useAccessibility();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;

  const needs = needsForUser(user);
  const recommended = recommendedToolsForNeeds(needs);
  const catalogKind = catalogKindForUser(user);

  const resolved = useMemo(() => {
    const size = btnRef.current?.getBoundingClientRect().width || FAB_SIZE;
    return clampPosition(position ?? defaultPosition(viewport), viewport, size);
  }, [position, viewport, prefs.largeButtons]);

  const panelStyle = useMemo<CSSProperties>(() => {
    const fabSize = prefs.largeButtons ? 68 : FAB_SIZE;
    const width = Math.min(430, Math.max(240, viewport.width - MARGIN * 2));
    const limit = Math.min(viewport.height * 0.78, 720);
    const above = resolved.y - MARGIN - 12;
    const below = viewport.height - (resolved.y + fabSize) - MARGIN - 12;
    const placeAbove = above >= Math.min(limit, 360) || above >= below;
    const maxHeight = Math.max(240, Math.min(limit, placeAbove ? above : below));
    const left = Math.min(
      Math.max(MARGIN, resolved.x + fabSize - width),
      Math.max(MARGIN, viewport.width - width - MARGIN)
    );
    const style: CSSProperties = { left, width, maxHeight };
    if (placeAbove) style.bottom = viewport.height - resolved.y + 12;
    else style.top = resolved.y + fabSize + 12;
    return style;
  }, [resolved, viewport, prefs.largeButtons]);

  useEffect(() => {
    const update = () => setViewport(readViewport());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (position) safeStorage.set(STORAGE_KEYS.a11yPosition, position);
  }, [position]);

  useEffect(() => {
    if (!position) return;
    const clamped = clampPosition(position, viewport);
    if (clamped.x !== position.x || clamped.y !== position.y) setPosition(clamped);
  }, [position, viewport]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else btnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== 'a') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      setOpen((value) => !value);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

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

  const changeScale = useCallback((direction: 1 | -1) => {
    const index = SCALE_VALUES.indexOf(prefs.textScale);
    const next = SCALE_VALUES[Math.min(SCALE_VALUES.length - 1, Math.max(0, index + direction))];
    updatePref('textScale', next);
    announce(`Texto al ${SCALE_LABELS[next]}.`);
  }, [prefs.textScale, updatePref, announce]);

  const isActive = (tool: AccessibilityTool) => {
    if (tool === 'textScale') return prefs.textScale > 1;
    if (tool === 'colorMode') return prefs.colorMode !== 'normal';
    return prefs[tool];
  };

  const moveBy = (dx: number, dy: number) => {
    setPosition((current) => {
      const base = current ?? resolved;
      return clampPosition({ x: base.x + dx, y: base.y + dy }, viewport);
    });
  };

  const handleMoveKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    };
    const direction = moves[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? MOVE_STEP * 2 : MOVE_STEP;
    moveBy(direction[0] * step, direction[1] * step);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, input, select, textarea, a')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: resolved.x,
      y: resolved.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };

  const continueDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const size = btnRef.current?.getBoundingClientRect().width || FAB_SIZE;
    setPosition(clampPosition({
      x: drag.x + event.clientX - drag.startX,
      y: drag.y + event.clientY - drag.startY,
    }, viewport, size));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  const resetPosition = () => {
    safeStorage.remove(STORAGE_KEYS.a11yPosition);
    setPosition(null);
    announce('Panel de accesibilidad vuelto a su posición inicial.');
  };

  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const matches = (tool: AccessibilityTool) =>
    `${TOOL_LABELS[tool]} ${TOOL_DESCRIPTIONS[tool]}`.toLocaleLowerCase('es').includes(normalizedQuery);
  const visibleRecommended = recommended.filter(matches);
  const visibleOther = ALL_TOOLS.filter((tool) => !recommended.includes(tool) && matches(tool));
  const activeCount = ALL_TOOLS.filter(isActive).length;

  const toolControl = (tool: AccessibilityTool, suggested: boolean) => {
    if (tool === 'textScale') {
      return (
        <ScaleControl
          key={tool} suggested={suggested} value={SCALE_LABELS[prefs.textScale]}
          onDecrease={() => changeScale(-1)} onIncrease={() => changeScale(1)}
        />
      );
    }
    if (tool === 'colorMode') {
      return (
        <div className={`${styles.row} ${isActive(tool) ? styles.rowActive : ''}`} key={tool}>
          <span className={styles.toolIcon} aria-hidden="true">{TOOL_ICONS[tool]}</span>
          <div className={styles.rowLabel}>
            <span className={styles.labelLine}>
              {TOOL_LABELS[tool]}
              {suggested && <span className={styles.badge}>Recomendada</span>}
            </span>
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
        key={tool} id={`pref-${tool}`} label={TOOL_LABELS[tool]} icon={TOOL_ICONS[tool]}
        description={TOOL_DESCRIPTIONS[tool]} recommended={suggested} active={isActive(tool)}
        checked={isActive(tool)} onChange={(value) => change(tool, value)}
      />
    );
  };

  return (
    <>
      <button ref={btnRef} className={styles.fab} style={{ left: resolved.x, top: resolved.y }}
        aria-label="Opciones de accesibilidad" aria-expanded={open} aria-controls={panelId}
        aria-keyshortcuts="Alt+A" onClick={() => setOpen((value) => !value)}>
        <AccessibilityIcon aria-hidden="true" />
        {activeCount > 0 && <span className={styles.fabBadge} aria-hidden="true">{activeCount}</span>}
      </button>
      {open && (
        <div id={panelId} ref={panelRef} role="dialog" aria-modal="true"
          aria-label="Menú de accesibilidad" tabIndex={-1}
          className={`${styles.panel} ${dragging ? styles.panelDragging : ''}`}
          style={panelStyle}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
            handleFocusTrap(event);
          }}>
          <div className={styles.panelHeader} onPointerDown={startDrag}
            onPointerMove={continueDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <div className={styles.headerText}>
              <span className={styles.headerIcon} aria-hidden="true"><AccessibilityIcon /></span>
              <div>
                <h2 className={styles.panelTitle}>Accesibilidad</h2>
                <p className={styles.panelSubtitle}>
                  {user ? `${needsLabel(needs)} · ${CATALOG_KIND_LABELS[catalogKind]}` : 'Configura tu experiencia antes de entrar'}
                </p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.iconButton} aria-label="Mover panel de accesibilidad"
                aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
                title="Arrastra el encabezado o usa las flechas" onKeyDown={handleMoveKeyDown}>
                <MoveIcon aria-hidden="true" />
              </button>
              <button className={styles.iconButton} aria-label="Cerrar menú de accesibilidad"
                onClick={() => setOpen(false)}>
                <CloseIcon aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className={styles.quickBar} role="group" aria-label="Accesos rápidos de accesibilidad">
            <span className={styles.quickLabel}>Accesos rápidos</span>
            <button className={styles.quickButton} onClick={() => changeScale(-1)} aria-label="Reducir texto">A−</button>
            <button className={styles.quickButton} onClick={() => changeScale(1)} aria-label="Aumentar texto">A+</button>
            <button className={`${styles.quickButton} ${prefs.highContrast ? styles.quickActive : ''}`}
              aria-label="Alternar alto contraste" aria-pressed={prefs.highContrast}
              onClick={() => change('highContrast', !prefs.highContrast)}>◐</button>
            <span className={styles.quickScale}>{SCALE_LABELS[prefs.textScale]}</span>
          </div>
          <div className={styles.searchBox}>
            <label htmlFor={searchId} className={styles.searchLabel}>Buscar herramienta</label>
            <input id={searchId} type="search" value={query} autoComplete="off"
              placeholder="Ej.: contraste, texto, teclado…"
              onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className={styles.panelBody}>
            {visibleRecommended.length > 0 && (
              <>
                <h3 className={styles.sectionTitle}>Mi configuración personalizada</h3>
                <p className={styles.sectionHint}>Herramientas recomendadas para tus necesidades.</p>
                {visibleRecommended.map((tool) => toolControl(tool, true))}
              </>
            )}
            {visibleOther.length > 0 && (
              <>
                <h3 className={styles.sectionTitle}>Otras opciones de accesibilidad</h3>
                <p className={styles.sectionHint}>Puedes combinarlas con tus recomendaciones.</p>
                {visibleOther.map((tool) => toolControl(tool, false))}
              </>
            )}
            {visibleRecommended.length === 0 && visibleOther.length === 0 && (
              <div className={styles.emptyState}>
                <p>No encontramos herramientas con «{query}».</p>
                <button className="btn btn-secondary" onClick={() => setQuery('')}>Limpiar búsqueda</button>
              </div>
            )}
            {!normalizedQuery && !recommended.length && (
              <p className={styles.sectionHint}>
                No has declarado necesidades. Puedes activar cualquier herramienta en «Otras opciones».
              </p>
            )}
          </div>
          <div className={styles.panelFooter}>
            <div className={styles.footerActions}>
              <button className="btn btn-ghost" onClick={() => {
                resetPrefs();
                announce('Preferencias restablecidas a valores predeterminados.');
              }}>
                Restablecer configuración
              </button>
              <button className="btn btn-ghost" onClick={resetPosition}>Centrar botón</button>
            </div>
            <p className={styles.footerNote}>Alt + A abre este menú. Los cambios se guardan automáticamente.</p>
          </div>
        </div>
      )}
    </>
  );
}

interface ToggleRowProps {
  id: string;
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  active: boolean;
  recommended: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ id, icon, label, description, checked, active, recommended, onChange }: ToggleRowProps) {
  return (
    <div className={`${styles.row} ${active ? styles.rowActive : ''}`}>
      <span className={styles.toolIcon} aria-hidden="true">{icon}</span>
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
    <div className={`${styles.row} ${value !== '100 %' ? styles.rowActive : ''}`}>
      <span className={styles.toolIcon} aria-hidden="true">{TOOL_ICONS.textScale}</span>
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

function AccessibilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      width="30" height="30" {...props}>
      <circle cx="12" cy="3.5" r="2" />
      <path d="M19 7.5H5a1 1 0 0 0 0 2h4.5l-1.6 7.2-2.9 3.3a1 1 0 1 0 1.5 1.3l3-3.4a1 1 0 0 0 .2-.4l.8-3.5h2l.8 3.5a1 1 0 0 0 .2.4l3 3.4a1 1 0 1 0 1.5-1.3l-2.9-3.3-1.6-7.2H19a1 1 0 0 0 0-2z" />
    </svg>
  );
}

function MoveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="20" height="20" {...props}>
      <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      width="20" height="20" {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}
