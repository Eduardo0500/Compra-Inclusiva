import { useCallback, useMemo, useState } from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { askAssistant, type AssistantAnswer } from '../../services/assistant';
import { catalogKindForUser } from '../../services/identity';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  suggestions?: string[];
  mode?: AssistantAnswer['mode'];
}

const WELCOME = 'Hola. Soy el Asistente Inclusivo. Puedo buscar productos, explicar categorías y ayudarte a preparar tu compra. Yo no confirmo pedidos.';

export function useAssistant() {
  const { user } = useAuth();
  const { prefs, announce } = useAccessibility();
  const catalogKind = catalogKindForUser(user);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME, suggestions: ['¿Qué productos hay?', 'Buscar agua', '¿Cómo agrego al carrito?', '¿Cómo compro?'] },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const context = useMemo(() => ({ user, prefs, catalogKind }), [user, prefs, catalogKind]);

  const send = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setError('');
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text },
    ]);
    setBusy(true);
    try {
      const answer = await askAssistant(text, context);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answer.text,
          suggestions: answer.suggestions,
          mode: answer.mode,
        },
      ]);
      announce('El Asistente Inclusivo ha respondido.');
    } catch {
      setError('El asistente no pudo responder. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [busy, context, announce]);

  return { messages, send, busy, error, catalogKind, prefs, user };
}
