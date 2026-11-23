import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAssistant } from './useAssistant';

export function ChatPage() {
  const { messages, send, busy, error, catalogKind } = useAssistant();
  const [input, setInput] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
    setInput('');
  };

  const lastSuggestions = [...messages].reverse().find((message) => message.suggestions?.length)?.suggestions ?? [];

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page chat-page" tabIndex={-1}>
        <h1>Asistente Inclusivo</h1>
        <p className="demo-banner" role="note">
          <strong>Modo demostración:</strong> respuestas basadas en el catálogo real de la tienda.
          Si se configura un backend de IA, se indicará cuando la respuesta venga del servicio externo.
        </p>
        <p className="muted">Tu catálogo: {catalogKind}. Puedo adaptar mis respuestas a tus necesidades.</p>
        <div className="chat-log" role="log" aria-label="Conversación con el Asistente Inclusivo" aria-live="polite">
          {messages.map((message) => (
            <article className={`chat-message ${message.role}`} key={message.id}>
              <p><strong>{message.role === 'assistant' ? 'Asistente' : 'Tú'}:</strong> {message.text}</p>
            </article>
          ))}
          {busy && <p className="muted" role="status">El asistente está escribiendo…</p>}
        </div>
        {error && <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {error}</p>}
        {lastSuggestions.length > 0 && (
          <div className="chips" aria-label="Preguntas sugeridas">
            {lastSuggestions.map((suggestion) => (
              <button key={suggestion} className="chip" type="button" onClick={() => void send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <form className="chat-input" onSubmit={submit}>
          <label htmlFor="chat-question">Escribe tu pregunta</label>
          <input id="chat-question" type="text" value={input} autoComplete="off"
            placeholder="Por ejemplo: ¿cuánto cuesta el jabón?" />
          <button className="btn btn-primary" type="submit" disabled={busy}>Enviar pregunta</button>
        </form>
        <p className="muted">No puedo confirmar pedidos ni realizar compras. Debes hacerlo tú en el proceso de compra.</p>
        <Link className="btn btn-secondary" to={`/catalog/${catalogKind}`}>Volver al catálogo</Link>
      </main>
    </>
  );
}
