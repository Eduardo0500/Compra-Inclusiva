import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent,
  type PointerEvent as RPointerEvent, type SVGProps,
} from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { safeStorage, STORAGE_KEYS } from '../../services/storage';
import {
  ALL_TOOLS, CATALOG_KIND_LABELS, TOOL_DESCRIPTIONS, TOOL_LABELS,
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
const FAB = 56;

/* ── Helpers de viewport ────────────────────────────────────────────────── */
interface VP { w: number; h: number; ox: number; oy: number }
function getVP(): VP {
  if (typeof window === 'undefined') return { w: 1280, h: 800, ox: 0, oy: 0 };
  const vv = window.visualViewport;
  return {
    w: vv ? vv.width  : window.innerWidth,
    h: vv ? vv.height : window.innerHeight,
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

  const btnRef   = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef  = useRef<{ id: number; sx: number; sy: number; px: number; py: number } | null>(null);
  const didMove  = useRef(false);

  const panelId  = useId();

  const { prefs, updatePref, resetPrefs, announce } = useAccessibility();
  const auth  = useOptionalAuth();
  const user  = auth?.user ?? null;
  const needs = needsForUser(user);
  const rec   = recommendedToolsForNeeds(needs);
  const catKind = catalogKindForUser(user);

  const fabSize = prefs.largeButtons ? 64 : FAB;

  /* resolved FAB position */
  const resolved = useMemo<Pos>(() => {
    const base = pos ?? { x: vp.w - fabSize - MARGIN, y: vp.h - fabSize - MARGIN };
    return clamp(base, vp, fabSize);
  }, [pos, vp, fabSize]);

  /* panel style: above or below FAB */
  const panelStyle = useMemo<CSSProperties>(() => {
    const W = Math.min(360, Math.max(280, vp.w - MARGIN * 2));
    const above = resolved.y - MARGIN - 8;
    const below = vp.h - (resolved.y + fabSize) - MARGIN - 8;
    const maxH  = Math.min(Math.max(above, below), vp.h * 0.78);
    const left  = Math.min(
      Math.max(MARGIN, resolved.x + fabSize - W),
      vp.w - W - MARGIN,
    );
    const s: CSSProperties = { width: W, maxHeight: Math.max(240, maxH), left: left + vp.ox };
    if (above >= below) s.bottom = vp.h - resolved.y + 8 - vp.oy;
    else                s.top    = resolved.y + fabSize + 8 + vp.oy;
    return s;
  }, [resolved, vp, fabSize]);

  /* ── efectos ── */
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

  /* ── drag en el FAB ── */
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
    if (!didMove.current) setOpen(v => !v);
  };

  /* ── focus trap ── */
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

  /* ── helpers de preferencia ── */
  const change = useCallback((tool: AccessibilityTool, val: boolean | string) => {
    updatePref(tool as keyof AccessibilityPreferences, val as never);
    announce(`${TOOL_LABELS[tool]} ${typeof val === 'boolean' ? (val ? 'activado' : 'desactivado') : 'actualizado'}.`);
  }, [updatePref, announce]);

  const changeScale = useCallback((dir: 1 | -1) => {
    const idx  = SCALES.indexOf(prefs.textScale);
    const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, idx + dir))];
    updatePref('textScale', next);
    announce(`Texto al ${SCALE_PCT[next]}.`);
  }, [prefs.textScale, updatePref, announce]);

  const isActive = (tool: AccessibilityTool): boolean => {
    if (tool === 'textScale')  return prefs.textScale > 1;
    if (tool === 'colorMode')  return prefs.colorMode !== 'normal';
    return !!(prefs[tool as keyof AccessibilityPreferences]);
  };

  const activeCount = ALL_TOOLS.filter(isActive).length;

  /* ── render de cada herramienta ── */
  const renderTool = (tool: AccessibilityTool, suggested: boolean) => {
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
  };

  /* ── grupos ── */
  const recTools   = rec;
  const otherTools = ALL_TOOLS.filter(t => !rec.includes(t));

  /* ── JSX ── */
  return (
    <>
      {/* FAB */}
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
            <button className={styles.closeBtn} aria-label="Cerrar" onClick={() => setOpen(false)}>
              <CloseIcon aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className={styles.panelBody}>
            {recTools.length > 0 && (
              <>
                <p className={styles.sectionTitle}>Para ti</p>
                {recTools.map(t => renderTool(t, true))}
              </>
            )}
            <p className={styles.sectionTitle}>
              {recTools.length > 0 ? 'Más opciones' : 'Opciones de accesibilidad'}
            </p>
            {otherTools.map(t => renderTool(t, false))}
          </div>

          {/* Footer */}
          <div className={styles.panelFooter}>
            <button className={styles.footerBtn}
              onClick={() => { resetPrefs(); announce('Preferencias restablecidas.'); }}>
              Restablecer
            </button>
            <button className={styles.footerBtn}
              onClick={() => { safeStorage.remove(STORAGE_KEYS.a11yPosition); setPos(null); announce('Botón centrado.'); }}>
              Centrar botón
            </button>
            <p className={styles.footerNote}>Alt&nbsp;+&nbsp;A abre este menú.</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Iconos ─────────────────────────────────────────────────────────────── */
function A11yIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      width="26" height="26" {...p}>
      <circle cx="12" cy="3.5" r="2" />
      <path d="M19 7.5H5a1 1 0 0 0 0 2h4.5l-1.6 7.2-2.9 3.3a1 1 0 1 0 1.5 1.3l3-3.4a1 1 0 0 0 .2-.4l.8-3.5h2l.8 3.5a1 1 0 0 0 .2.4l3 3.4a1 1 0 1 0 1.5-1.3l-2.9-3.3-1.6-7.2H19a1 1 0 0 0 0-2z" />
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
