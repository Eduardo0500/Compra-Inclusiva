import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAssistant } from './useAssistant';

export function ChatPage() {
  const {
    messages, send, busy, error, catalogKind,
    speechState, supportsRec, supportsSpeech,
    ttsEnabled, setTts, ttsSpeed, setTtsSpeed,
    startListening, stopListening, pauseTts, resumeTts, stopTts, repeatLast,
  } = useAssistant();

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    void send(input);
    setInput('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleVoice = () => {
    if (speechState === 'listening') { stopListening(); return; }
    startListening((text) => {
      void send(text);
    });
  };

  const lastSuggestions = [...messages].reverse()
    .find(m => m.suggestions?.length)?.suggestions ?? [];

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page chat-page" tabIndex={-1}>
        <h1>Asistente Inclusivo</h1>

        <p className="demo-banner" role="note">
          <strong>Modo demostración:</strong> respuestas basadas en el catálogo real de la tienda.
        </p>
        <p className="muted">Tu catálogo: {catalogKind}.</p>

        {/* Controles de voz (TTS) */}
        {supportsSpeech && (
          <div role="group" aria-label="Controles de voz" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              aria-label={ttsEnabled ? 'Desactivar lectura en voz alta' : 'Activar lectura en voz alta'}
              aria-pressed={ttsEnabled}
              onClick={() => setTts(v => !v)}
            >🔊 {ttsEnabled ? 'Voz activa' : 'Activar voz'}</button>
            {ttsEnabled && (
              <>
                <button className="btn btn-ghost" aria-label="Pausar" onClick={pauseTts}>⏸ Pausar</button>
                <button className="btn btn-ghost" aria-label="Reanudar" onClick={resumeTts}>▶ Reanudar</button>
                <button className="btn btn-ghost" aria-label="Detener" onClick={stopTts}>⏹ Detener</button>
                <button className="btn btn-ghost" aria-label="Repetir última respuesta" onClick={repeatLast}>🔁 Repetir</button>
                <label htmlFor="chat-tts-speed">Velocidad:</label>
                <select id="chat-tts-speed" value={ttsSpeed} onChange={e => setTtsSpeed(Number(e.target.value))}
                  style={{ minHeight: 40, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 0.4rem' }}>
                  <option value={0.75}>Lenta</option>
                  <option value={1.0}>Normal</option>
                  <option value={1.5}>Rápida</option>
                </select>
              </>
            )}
          </div>
        )}

        {/* Log de conversación */}
        <div
          className="chat-log"
          role="log"
          aria-live="polite"
          aria-label="Conversación con el Asistente Inclusivo"
        >
          {messages.map(msg => (
            <article className={`chat-message ${msg.role}`} key={msg.id}>
              <span className="sr-only">{msg.role === 'user' ? 'Tú dijiste: ' : 'Asistente dijo: '}</span>
              <p><strong aria-hidden="true">{msg.role === 'assistant' ? 'Asistente' : 'Tú'}:</strong> {msg.text}</p>
            </article>
          ))}
          {busy && <p className="muted" role="status">El asistente está escribiendo…</p>}
        </div>

        {error && <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {error}</p>}

        {lastSuggestions.length > 0 && (
          <div className="chips" aria-label="Preguntas sugeridas">
            {lastSuggestions.map(s => (
              <button key={s} className="chip" type="button" onClick={() => void send(s)}>{s}</button>
            ))}
          </div>
        )}

        <form className="chat-input" onSubmit={submit} aria-label="Enviar mensaje al asistente">
          <label htmlFor="chat-question">Escribe tu pregunta</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="chat-question"
              ref={inputRef}
              type="text"
              value={input}
              autoComplete="off"
              placeholder="Por ejemplo: ¿cuánto cuesta el jabón?"
              onChange={e => setInput(e.target.value)}
            />
            {supportsRec && (
              <button type="button" className="btn btn-secondary"
                aria-label={speechState === 'listening' ? 'Detener escucha' : 'Hablar'}
                aria-pressed={speechState === 'listening'}
                onClick={handleVoice}
                style={{ minWidth: 44 }}
              >{speechState === 'listening' ? '⏹' : '🎤 Hablar'}</button>
            )}
            <button className="btn btn-primary" type="submit" disabled={busy}>Enviar pregunta</button>
          </div>
          {speechState === 'listening' && (
            <p role="status" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.3rem' }}>
              🎙 Escuchando…
            </p>
          )}
        </form>

        <p className="muted">No puedo confirmar pedidos ni realizar compras.</p>
        <Link className="btn btn-secondary" to={`/catalog/${catalogKind}`}>Volver al catálogo</Link>
      </main>
    </>
  );
}
