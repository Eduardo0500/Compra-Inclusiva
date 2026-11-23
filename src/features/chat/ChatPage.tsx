import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { SkipLink } from '../../shared/SkipLink';
import { PRODUCTS } from '../catalog/products';

interface Message { role: 'assistant' | 'user'; text: string }

export function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hola. Soy el Asistente Inclusivo en modo demostración. Puedo buscar productos, explicar categorías y ayudarte a navegar.' },
  ]);

  function send() {
    const question = input.trim();
    if (!question) return;
    const lower = question.toLowerCase();
    let answer = 'No encontré esa información. Puedes buscar por nombre o preguntar por categorías.';
    if (lower.includes('categor')) {
      answer = 'Tenemos: Alimentos, Bebidas, Limpieza, Higiene personal, Productos para el hogar y Cuidado personal.';
    } else if (lower.includes('carrito')) {
      answer = 'Puedes revisar tu carrito en la opción “Carrito”. Allí puedes cambiar cantidades o eliminar productos.';
    } else if (lower.includes('compra') || lower.includes('pagar') || lower.includes('pedido')) {
      answer = 'Para comprar: abre el carrito, continúa al checkout y confirma cada paso. No realizo compras sin tu autorización.';
    } else {
      const searchMatches = PRODUCTS.filter((product) =>
        lower.split(/\s+/).some((word) => word.length > 3 && `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(word))
      ).slice(0, 3);
      if (searchMatches.length) {
        answer = `Encontré: ${searchMatches.map((product) => `${product.name}, $${product.price.toLocaleString('es-CO')}`).join('; ')}.`;
      }
    }
    if (user?.disabilities.includes('cognitiva')) {
      answer = answer.split('.')[0] + '.';
    }
    setMessages((current) => [...current, { role: 'user', text: question }, { role: 'assistant', text: answer }]);
    setInput('');
  }

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page chat-page">
        <h1>Asistente Inclusivo</h1>
        <p><strong>Modo demostración:</strong> respuestas locales básicas. No usa una API externa hasta configurarla.</p>
        <div className="chat-log" aria-live="polite" aria-label="Conversación">
          {messages.map((message, index) => (
            <p className={`chat-message ${message.role}`} key={index}><strong>{message.role === 'assistant' ? 'Asistente' : 'Tú'}:</strong> {message.text}</p>
          ))}
        </div>
        <div className="chat-input">
          <label htmlFor="chat-question">Escribe tu pregunta</label>
          <input id="chat-question" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} />
          <button className="btn btn-primary" onClick={send}>Enviar</button>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/catalog')}>Volver al catálogo</button>
      </main>
    </>
  );
}
