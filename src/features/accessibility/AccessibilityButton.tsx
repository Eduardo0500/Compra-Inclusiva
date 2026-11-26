import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent,
  type PointerEvent as RPointerEvent, type SVGProps,
} from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { safeStorage, STORAGE_KEYS } from '../../services/storage';
import {
  CATALOG_KIND_LABELS, TOOL_CATEGORIES, TOOL_DESCRIPTIONS, TOOL_LABELS,
  catalogKindForUser, needsForUser, needsLabel, recommendedToolsForNeeds,
  type AccessibilityTool,
} from '../../services/identity';
import type { AccessibilityPreferences } from '../../types/accessibility';
import styles from './AccessibilityButton.module.css';

/* ── Constantes ─────────────────────────────────────────────────────────── */
const SCALES: AccessibilityPreferences['textScale'][] = [1, 1.25, 1.5, 1.75, 2];
const SCALE_PCT: Record<AccessibilityPreferences['textScale'], string> = {
  1: '100%', 1.25: '125%', 1.5: '150%', 1.75: '175%', 2: '200%',
};
const TOOL_ICONS: Record<AccessibilityTool, string> = {
  highContrast: '◐', textScale: 'Aa', largeButtons: '▣', captions: 'CC',
  signLanguage: 'LS', visualAlerts: '!', simpleLanguage: '≡', extraSpacing: '↕',
  readContent: '▶', keyboardNavigation: '⌨', colorMode: '◧',
};
const MARGIN = 16;
const FAB    = 56;
const MOVE_STEP = 24;

/* ── Helpers de viewport ────────────────────────────────────────────────── */
interface VP { w: number; h: number; ox: number; oy: number }
function getVP(): VP {
  if (typeof window === 'undefined') return { w: 1280, h: 800, ox: 0, oy: 0 };
  const vv = window.visualViewport;
  return {
    w:  vv ? vv.width  : window.innerWidth,
    h:  vv ? vv.height : window.innerHeight,
    ox: vv ? vv.offsetLeft : 0,
    oy: vv ? vv.offsetTop  : 0,
  };
}
interface Pos { x: number; y: number }
function clamp(p: Pos, vp: VP, size: number): Pos {
  return {
    x: Math.min(Math.max(MARGIN, p.x), Math.max(MARGIN, vp.w - size - MARGIN)),
    y: Math.min(Math.max(MARGIN, p.y), Math.max(MARGIN, vp.h - size - MARGIN)),
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   Componente principal
   ══════════════════════════════════════════════════════════════════════════ */
export function AccessibilityButton() {
  const [open, setOpen]       = useState(false);
  const [vp, setVp]           = useState<VP>(getVP);
  const [pos, setPos]         = useState<Pos | null>(() => {
    const s = safeStorage.get<Pos | null>(STORAGE_KEYS.a11yPosition, null);
    return s && Number.isFinite(s.x) ? s : null;
  });
  const [isDragging, setDrag] = useState(false);
  const [query, setQuery]     = useState('');
  /* categorías abiertas por id */
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const btnRef    = useRef<HTMLButtonElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const dragRef   = useRef<{ id: number; sx: number; sy: number; px: number; py: number } | null>(null);
  const didMove   = useRef(false);
  const moveBtnRef = useRef<HTMLButtonElement>(null);

  const panelId   = useId();
  const searchId  = `${panelId}-search`;

  const { prefs, updatePref, resetPrefs, announce } = useAccessibility();
  const auth    = useOptionalAuth();
  const user    = auth?.user ?? null;
  const needs   = needsForUser(user);
  const rec     = recommendedToolsForNeeds(needs);
  const catKind = catalogKindForUser(user);
  const fabSize = prefs.largeButtons ? 64 : FAB;

  /* categorías recomendadas para este usuario */
  const recCatIds = useMemo(
    () => new Set(TOOL_CATEGORIES.filter(c => needs.includes(c.id as never)).map(c => c.id)),
    [needs],
  );

  /* al abrir el panel, expandir las categorías recomendadas */
  useEffect(() => {
    if (open) setOpenCats(new Set(recCatIds));
  }, [open]);

  /* resolved FAB position */
  const resolved = useMemo<Pos>(() => {
    const base = pos ?? { x: vp.w - fabSize - MARGIN, y: vp.h - fabSize - MARGIN };
    return clamp(base, vp, fabSize);
  }, [pos, vp, fabSize]);

  /* panel style: above or below FAB */
  const panelStyle = useMemo<CSSProperties>(() => {
    const W    = Math.min(380, Math.max(280, vp.w - MARGIN * 2));
    const above = resolved.y - MARGIN - 8;
    const below = vp.h - (resolved.y + fabSize) - MARGIN - 8;
    const maxH  = Math.min(Math.max(above, below), vp.h * 0.82);
    const left  = Math.min(
      Math.max(MARGIN, resolved.x + fabSize - W),
      vp.w - W - MARGIN,
    );
    const s: CSSProperties = { width: W, maxHeight: Math.max(260, maxH), left: left + vp.ox };
    if (above >= below) s.bottom = vp.h - resolved.y + 8 - vp.oy;
    else                s.top    = resolved.y + fabSize + 8 + vp.oy;
    return s;
  }, [resolved, vp, fabSize]);

  /* ── efectos de viewport y teclado ──────────────────────────────────── */
  useEffect(() => {
    const up = () => setVp(getVP());
    window.addEventListener('resize', up);
    window.visualViewport?.addEventListener('resize', up);
    window.visualViewport?.addEventListener('scroll', up);
    return () => {
      window.removeEventListener('resize', up);
      window.visualViewport?.removeEventListener('resize', up);
      window.visualViewport?.removeEventListener('scroll', up);
    };
  }, []);

  useEffect(() => {
    if (!pos) return;
    const c = clamp(pos, vp, fabSize);
    if (c.x !== pos.x || c.y !== pos.y) setPos(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vp, fabSize]);

  useEffect(() => { if (pos) safeStorage.set(STORAGE_KEYS.a11yPosition, pos); }, [pos]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else      btnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.key.toLowerCase() !== 'a') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input,textarea,select,[contenteditable]')) return;
      e.preventDefault();
      setOpen(v => !v);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ── drag en el FAB ─────────────────────────────────────────────────── */
  const onDown = (e: RPointerEvent<HTMLButtonElement>) => {
    dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: resolved.x, py: resolved.y };
    didMove.current = false;
    btnRef.current?.setPointerCapture(e.pointerId);
    setDrag(true);
  };
  const onMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didMove.current = true;
    if (didMove.current) setPos(clamp({ x: d.px + dx, y: d.py + dy }, vp, fabSize));
  };
  const onUp = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current || dragRef.current.id !== e.pointerId) return;
    btnRef.current?.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDrag(false);
    // No toggle aquí — lo hace onClick para compatibilidad con jsdom/tests
  };
  const onFabClick = () => {
    // Solo abre/cierra si no hubo arrastre
    if (!didMove.current) setOpen(v => !v);
    didMove.current = false;
  };

  /* ── mover con teclado (botón "Mover panel") ─────────────────────────── */
  const moveBy = useCallback((dx: number, dy: number) => {
    setPos(cur => {
      const base = cur ?? resolved;
      return clamp({ x: base.x + dx, y: base.y + dy }, vp, fabSize);
    });
  }, [resolved, vp, fabSize]);

  const handleMoveKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, [number, number]> = {
      ArrowLeft:  [-1, 0], ArrowRight: [1, 0],
      ArrowUp:    [0, -1], ArrowDown:  [0, 1],
    };
    const dir = map[e.key];
    if (!dir) return;
    e.preventDefault();
    const step = e.shiftKey ? MOVE_STEP * 2 : MOVE_STEP;
    moveBy(dir[0] * step, dir[1] * step);
    safeStorage.set(STORAGE_KEYS.a11yPosition, pos ?? resolved);
  }, [moveBy, pos, resolved]);

  /* ── focus trap ─────────────────────────────────────────────────────── */
  const trap = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled'));
    if (!els.length) return;
    if (e.shiftKey && document.activeElement === els[0])
      { e.preventDefault(); els[els.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === els[els.length - 1])
      { e.preventDefault(); els[0].focus(); }
  }, []);

  /* ── helpers de preferencia ─────────────────────────────────────────── */
  const change = useCallback((tool: AccessibilityTool, val: boolean | string) => {
    updatePref(tool as keyof AccessibilityPreferences, val as never);
    const label = `${TOOL_LABELS[tool]} ${typeof val === 'boolean' ? (val ? 'activado' : 'desactivado') : 'actualizado'}`;
    announce(label);
  }, [updatePref, announce]);

  const changeScale = useCallback((dir: 1 | -1) => {
    const idx  = SCALES.indexOf(prefs.textScale);
    const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, idx + dir))];
    updatePref('textScale', next);
    announce(`Texto al ${SCALE_PCT[next]}.`);
  }, [prefs.textScale, updatePref, announce]);

  const isActive = useCallback((tool: AccessibilityTool): boolean => {
    if (tool === 'textScale')  return prefs.textScale > 1;
    if (tool === 'colorMode')  return prefs.colorMode !== 'normal';
    return !!(prefs[tool as keyof AccessibilityPreferences]);
  }, [prefs]);

  const activeCount = useMemo(
    () => TOOL_CATEGORIES.flatMap(c => c.tools).filter((t, i, a) => a.indexOf(t) === i && isActive(t)).length,
    [isActive],
  );

  /* ── filtro de búsqueda ─────────────────────────────────────────────── */
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const matchTool = (tool: AccessibilityTool) =>
    !normalizedQuery ||
    `${TOOL_LABELS[tool]} ${TOOL_DESCRIPTIONS[tool]}`.toLocaleLowerCase('es').includes(normalizedQuery);

  /* ── render de un control de herramienta ────────────────────────────── */
  const renderTool = useCallback((tool: AccessibilityTool, suggested: boolean) => {
    const active = isActive(tool);

    if (tool === 'textScale') {
      const pct   = SCALE_PCT[prefs.textScale];
      const idx   = SCALES.indexOf(prefs.textScale);
      const fillW = `${(idx / (SCALES.length - 1)) * 100}%`;
      return (
        <div key={tool} className={`${styles.scaleRow} ${active ? styles.rowActive : ''}`}>
          <div className={styles.scaleRowTop}>
            <span className={styles.toolIcon} aria-hidden="true">{TOOL_ICONS[tool]}</span>
            <div className={styles.rowLabel}>
              <span className={styles.rowName}>
                Tamaño de texto
                {suggested && <span className={styles.badgeRec}>Recomendada</span>}
              </span>
              <span className={styles.rowDesc}>Ajusta el tamaño de todo el texto.</span>
            </div>
          </div>
          <div className={styles.scaleControls}>
            <button className={styles.stepBtn} onClick={() => changeScale(-1)} aria-label="Reducir texto">−</button>
            <div className={styles.stepTrack} aria-hidden="true">
              <div className={styles.stepFill} style={{ width: fillW }} />
            </div>
            <span className={styles.stepValue} aria-live="polite">{pct}</span>
            <button className={styles.stepBtn} onClick={() => changeScale(1)} aria-label="Aumentar texto">+</button>
          </div>
        </div>
      );
    }

    if (tool === 'colorMode') {
      return (
        <div key={tool} className={`${styles.row} ${active ? styles.rowActive : ''}`}>
          <span className={styles.toolIcon} aria-hidden="true">{TOOL_ICONS[tool]}</span>
          <div className={styles.rowLabel}>
            <span className={styles.rowName}>
              {TOOL_LABELS[tool]}
              {suggested && <span className={styles.badgeRec}>Recomendada</span>}
            </span>
            <span className={styles.rowDesc}>{TOOL_DESCRIPTIONS[tool]}</span>
          </div>
          <select className={styles.select} value={prefs.colorMode} aria-label="Modo de color"
            onChange={e => change(tool, e.target.value)}>
            <option value="normal">Normal</option>
            <option value="blue-yellow">Azul / amarillo</option>
          </select>
        </div>
      );
    }

    return (
      <div key={tool} className={`${styles.row} ${active ? styles.rowActive : ''}`}>
        <span className={styles.toolIcon} aria-hidden="true">{TOOL_ICONS[tool]}</span>
        <div className={styles.rowLabel}>
          <span className={styles.rowName}>
            {TOOL_LABELS[tool]}
            {suggested && <span className={styles.badgeRec}>Recomendada</span>}
          </span>
          <span className={styles.rowDesc}>{TOOL_DESCRIPTIONS[tool]}</span>
        </div>
        <button
          id={`pref-${tool}`}
          role="switch"
          aria-checked={active}
          aria-label={TOOL_LABELS[tool]}
          className={`${styles.toggle} ${active ? styles.toggleOn : ''}`}
          onClick={() => change(tool, !active)}
        >
          <span className="sr-only">{active ? 'Activado' : 'Desactivado'}</span>
          <span className={styles.toggleThumb} aria-hidden="true" />
        </button>
      </div>
    );
  }, [isActive, prefs, change, changeScale]);

  /* ── render de una categoría plegable ───────────────────────────────── */
  const renderCategory = (cat: typeof TOOL_CATEGORIES[0]) => {
    const isRec     = recCatIds.has(cat.id);
    const isOpen    = openCats.has(cat.id) || !!normalizedQuery;
    const bodyId    = `${panelId}-cat-${cat.id}`;
    const tools     = cat.tools.filter((t, i, a) => a.indexOf(t) === i && matchTool(t));
    if (tools.length === 0) return null;

    const toggle = () => {
      setOpenCats(prev => {
        const next = new Set(prev);
        if (next.has(cat.id)) next.delete(cat.id);
        else next.add(cat.id);
        return next;
      });
    };

    return (
      <div key={cat.id} className={`${styles.category} ${isRec ? styles.categoryRec : ''}`}>
        <button
          type="button"
          className={styles.categoryBtn}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={toggle}
        >
          <span className={styles.catIcon} aria-hidden="true">{cat.icon}</span>
          <span className={styles.catLabel}>
            {cat.label}
            {isRec && <span className={styles.catBadge}>Para ti</span>}
          </span>
          <span className={styles.catChevron} aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div id={bodyId} className={styles.categoryBody}>
            {tools.map(t => renderTool(t, isRec && rec.includes(t)))}
          </div>
        )}
      </div>
    );
  };

  /* ── JSX ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* FAB arrastrable */}
      <button
        ref={btnRef}
        className={`${styles.fab} ${isDragging ? styles.fabDragging : ''}`}
        style={{ left: resolved.x + vp.ox, top: resolved.y + vp.oy }}
        aria-label="Opciones de accesibilidad"
        aria-expanded={open}
        aria-controls={panelId}
        aria-keyshortcuts="Alt+A"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onFabClick}
      >
        <A11yIcon aria-hidden="true" />
        {activeCount > 0 && (
          <span className={styles.fabBadge} aria-hidden="true">{activeCount}</span>
        )}
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
          style={panelStyle}
          onKeyDown={e => { if (e.key === 'Escape') setOpen(false); trap(e); }}
        >
          {/* Header */}
          <div className={styles.panelHeader}>
            <span className={styles.headerIcon} aria-hidden="true"><A11yIcon /></span>
            <div className={styles.headerTitles}>
              <h2 className={styles.panelTitle}>Accesibilidad</h2>
              <p className={styles.panelSubtitle}>
                {user
                  ? `${needsLabel(needs)} · ${CATALOG_KIND_LABELS[catKind]}`
                  : 'Ajusta cómo se ve la app'}
              </p>
            </div>
            <div className={styles.headerActions}>
              {/* Botón mover con teclado */}
              <button
                ref={moveBtnRef}
                className={styles.iconBtn}
                aria-label="Mover panel de accesibilidad"
                title="Usa las flechas del teclado para mover el botón"
                onKeyDown={handleMoveKeyDown}
              >
                <MoveIcon aria-hidden="true" />
              </button>
              <button className={styles.closeBtn} aria-label="Cerrar" onClick={() => setOpen(false)}>
                <CloseIcon aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className={styles.searchBox}>
            <label htmlFor={searchId} className={styles.searchLabel}>Buscar herramienta</label>
            <input
              id={searchId}
              type="search"
              value={query}
              autoComplete="off"
              placeholder="Ej.: contraste, texto, subtítulos…"
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Body: categorías plegables */}
          <div className={styles.panelBody}>
            {/* Sección «Para ti» cuando hay recomendadas */}
            {rec.length > 0 && !normalizedQuery && (
              <p className={styles.sectionTitle}>Mi configuración personalizada</p>
            )}

            {TOOL_CATEGORIES.map(cat => renderCategory(cat))}

            {/* Estado vacío en búsqueda */}
            {normalizedQuery &&
              TOOL_CATEGORIES.every(c => c.tools.filter(t => matchTool(t)).length === 0) && (
              <p className={styles.emptySearch}>No se encontraron herramientas con «{query}».</p>
            )}
          </div>

          {/* Footer */}
          <div className={styles.panelFooter}>
            <button className={styles.footerBtn}
              onClick={() => { resetPrefs(); announce('Preferencias restablecidas.'); }}>
              Restablecer
            </button>
            <button className={styles.footerBtn}
              onClick={() => {
                safeStorage.remove(STORAGE_KEYS.a11yPosition);
                setPos(null);
                announce('Botón vuelto al centro.');
              }}>
              Centrar botón
            </button>
            <p className={styles.footerNote}>Alt&nbsp;+&nbsp;A abre y cierra este menú.</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Iconos SVG ──────────────────────────────────────────────────────────── */
function A11yIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      width="26" height="26" {...p}>
      <circle cx="12" cy="3.5" r="2" />
      <path d="M19 7.5H5a1 1 0 0 0 0 2h4.5l-1.6 7.2-2.9 3.3a1 1 0 1 0 1.5 1.3l3-3.4a1 1 0 0 0 .2-.4l.8-3.5h2l.8 3.5a1 1 0 0 0 .2.4l3 3.4a1 1 0 1 0 1.5-1.3l-2.9-3.3-1.6-7.2H19a1 1 0 0 0 0-2z" />
    </svg>
  );
}
function MoveIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="18" height="18" {...p}>
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 3v18M3 12h18" />
    </svg>
  );
}
function CloseIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      width="18" height="18" {...p}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}
