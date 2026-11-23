import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useAssistant } from './useAssistant';
import styles from './AssistantWidget.module.css';

export function AssistantWidget() {
  const { isAuthenticated } = useAuth();
  const { messages, send, busy, error, catalogKind } = useAssistant();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else buttonRef.current?.focus();
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
    setInput('');
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button ref={buttonRef} className={styles.fab}
        aria-label="Abrir Asistente Inclusivo" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">💬</span>
        <span className={styles.fabLabel}>Ayuda</span>
      </button>
      {open && (
        <div id={panelId} ref={panelRef} role="dialog" aria-modal="false"
          aria-label="Asistente Inclusivo" tabIndex={-1} className={styles.panel}
          onKeyDown={trapFocus}>
          <div className={styles.header}>
            <div>
              <h2>Asistente Inclusivo</h2>
              <p className={styles.subtitle}>Modo demostración · Catálogo {catalogKind}</p>
            </div>
            <button className="btn btn-ghost" aria-label="Cerrar Asistente Inclusivo"
              onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className={styles.log} role="log" aria-live="polite" aria-label="Conversación">
            {messages.map((message) => (
              <p key={message.id} className={`${styles.message} ${message.role === 'user' ? styles.user : ''}`}>
                <strong>{message.role === 'assistant' ? 'Asistente' : 'Tú'}:</strong> {message.text}
              </p>
            ))}
            {busy && <p role="status">Escribiendo…</p>}
          </div>
          {error && <p role="alert" className="error-msg"><span aria-hidden="true">⚠</span> {error}</p>}
          <form className={styles.form} onSubmit={submit}>
            <label htmlFor="widget-question">Tu pregunta</label>
            <div className={styles.inputRow}>
              <input id="widget-question" value={input} autoComplete="off"
                placeholder="Buscar un producto…"
                onChange={(event) => setInput(event.target.value)} />
              <button className="btn btn-primary" type="submit" disabled={busy}>Enviar</button>
            </div>
          </form>
          <p className={styles.note}>No realizo compras ni confirmo pedidos.</p>
          <Link className="btn btn-ghost" to="/chat" onClick={() => setOpen(false)}>Abrir ayuda completa</Link>
        </div>
      )}
    </>
  );
}
