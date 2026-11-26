import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useAssistant } from './useAssistant';
import styles from './AssistantWidget.module.css';

export function AssistantWidget() {
  const { isAuthenticated } = useAuth();
  const {
    messages, send, busy, error, catalogKind,
    speechState, supportsRec, supportsSpeech,
    ttsEnabled, setTts, ttsSpeed, setTtsSpeed,
    startListening, stopListening, pauseTts, resumeTts, stopTts, repeatLast,
  } = useAssistant();

  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [showHelp, setHelp]   = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const panelId   = useId();

  /* foco al abrir/cerrar */
  useEffect(() => {
    if (open) panelRef.current?.focus();
    else      buttonRef.current?.focus();
  }, [open]);

  /* Atajo Alt+C abre/cierra */
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.key.toLowerCase() !== 'c') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input,textarea,select,[contenteditable]')) return;
      e.preventDefault();
      setOpen(v => !v);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    void send(input);
    setInput('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const trapFocus = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled'));
    if (!els.length) return;
    if (e.shiftKey && document.activeElement === els[0])
      { e.preventDefault(); els[els.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === els[els.length - 1])
      { e.preventDefault(); els[0].focus(); }
  };

  const handleVoiceInput = () => {
    if (speechState === 'listening') { stopListening(); return; }
    startListening((text) => {
      setInput(text);
      void send(text);
      setInput('');
    });
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        ref={buttonRef}
        className={styles.fab}
        aria-label="Abrir Asistente Inclusivo"
        aria-expanded={open}
        aria-controls={panelId}
        aria-keyshortcuts="Alt+C"
        onClick={() => setOpen(v => !v)}
      >
        <span aria-hidden="true">💬</span>
        <span className={styles.fabLabel}>Ayuda</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Asistente Inclusivo"
          tabIndex={-1}
          className={styles.panel}
          onKeyDown={trapFocus}
        >
          {/* Cabecera */}
          <div className={styles.header}>
            <div>
              <h2>Asistente Inclusivo</h2>
              <p className={styles.subtitle}>Modo demostración · Catálogo {catalogKind}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="btn btn-ghost"
                aria-label="Ayuda de teclado"
                aria-pressed={showHelp}
                onClick={() => setHelp(v => !v)}
                style={{ fontSize: '0.8rem', minHeight: 36 }}
              >⌨ Atajos</button>
              <button
                className="btn btn-ghost"
                aria-label="Cerrar Asistente Inclusivo"
                onClick={() => setOpen(false)}
              >✕</button>
            </div>
          </div>

          {/* Ayuda de teclado */}
          {showHelp && (
            <div role="note" style={{ fontSize: '0.82rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
              <strong>Atajos de teclado:</strong>
              <ul style={{ margin: '0.3rem 0 0 1rem', lineHeight: 1.7 }}>
                <li><kbd>Alt+C</kbd> — Abrir / cerrar el chat</li>
                <li><kbd>Escape</kbd> — Cerrar el chat</li>
                <li><kbd>Enter</kbd> — Enviar mensaje</li>
              </ul>
            </div>
          )}

          {/* Log de conversación */}
          <div
            className={styles.log}
            role="log"
            aria-live="polite"
            aria-label="Conversación"
          >
            {messages.map((msg) => (
              <p key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.user : ''}`}>
                {/* Prefijo visible solo para lectores (WCAG 1.3.1) */}
                <span className="sr-only">{msg.role === 'user' ? 'Tú dijiste: ' : 'Asistente dijo: '}</span>
                <strong aria-hidden="true">{msg.role === 'assistant' ? 'Asistente' : 'Tú'}:</strong>{' '}
                {msg.text}
              </p>
            ))}
            {busy && <p role="status">Escribiendo…</p>}
          </div>

          {error && (
            <p role="alert" className="error-msg">
              <span aria-hidden="true">⚠</span> {error}
            </p>
          )}

          {/* Controles TTS */}
          {supportsSpeech && (
            <div role="group" aria-label="Controles de voz" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-ghost"
                aria-label={ttsEnabled ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}
                aria-pressed={ttsEnabled}
                style={{ fontSize: '0.8rem', minHeight: 36 }}
                onClick={() => setTts(v => !v)}
              >🔊 {ttsEnabled ? 'Voz activa' : 'Activar voz'}</button>
              {ttsEnabled && (
                <>
                  <button className="btn btn-ghost" aria-label="Pausar lectura" style={{ fontSize: '0.8rem', minHeight: 36 }} onClick={pauseTts}>⏸</button>
                  <button className="btn btn-ghost" aria-label="Reanudar lectura" style={{ fontSize: '0.8rem', minHeight: 36 }} onClick={resumeTts}>▶</button>
                  <button className="btn btn-ghost" aria-label="Detener lectura" style={{ fontSize: '0.8rem', minHeight: 36 }} onClick={stopTts}>⏹</button>
                  <button className="btn btn-ghost" aria-label="Repetir última respuesta" style={{ fontSize: '0.8rem', minHeight: 36 }} onClick={repeatLast}>🔁</button>
                  <label htmlFor="tts-speed" className="sr-only">Velocidad de voz</label>
                  <select
                    id="tts-speed"
                    value={ttsSpeed}
                    onChange={e => setTtsSpeed(Number(e.target.value))}
                    style={{ fontSize: '0.8rem', minHeight: 32, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    aria-label="Velocidad de voz"
                  >
                    <option value={0.75}>Lenta</option>
                    <option value={1.0}>Normal</option>
                    <option value={1.5}>Rápida</option>
                  </select>
                </>
              )}
            </div>
          )}

          {/* Formulario de envío */}
          <form className={styles.form} onSubmit={submit}>
            <label htmlFor="widget-question">Tu pregunta</label>
            <div className={styles.inputRow}>
              <input
                id="widget-question"
                ref={inputRef}
                value={input}
                autoComplete="off"
                placeholder="Buscar un producto…"
                onChange={e => setInput(e.target.value)}
              />
              {/* Botón de voz (solo si el navegador lo soporta) */}
              {supportsRec && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={speechState === 'listening' ? 'Detener escucha' : 'Hablar'}
                  aria-pressed={speechState === 'listening'}
                  onClick={handleVoiceInput}
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  {speechState === 'listening' ? '⏹' : '🎤'}
                </button>
              )}
              <button className="btn btn-primary" type="submit" disabled={busy}>Enviar</button>
            </div>
            {speechState === 'listening' && (
              <p role="status" style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>
                <span aria-hidden="true">🎙 </span>Escuchando…
              </p>
            )}
            {speechState === 'error' && (
              <p role="alert" className="error-msg" style={{ fontSize: '0.82rem' }}>
                No se pudo escuchar. Inténtalo de nuevo.
              </p>
            )}
          </form>

          <p className={styles.note}>No realizo compras ni confirmo pedidos.</p>
          <Link className="btn btn-ghost" to="/chat" onClick={() => setOpen(false)}
            style={{ fontSize: '0.85rem', minHeight: 36 }}>
            Abrir ayuda completa
          </Link>
        </div>
      )}
    </>
  );
}
