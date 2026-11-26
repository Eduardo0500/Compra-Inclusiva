import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { useShop } from '../../app/ShopContext';
import { askAssistant, type AssistantAnswer } from '../../services/assistant';
import { catalogKindForUser, needsForUser } from '../../services/identity';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  suggestions?: string[];
  mode?: AssistantAnswer['mode'];
}

/* ── tipos de Speech API (no incluidos en lib dom por defecto) ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionAPI = any;
type SpeechRecognitionEventAny = { results: { 0: { 0: { transcript: string } } } };

export type SpeechState = 'idle' | 'listening' | 'error';

const WELCOME = 'Hola. Soy el Asistente Inclusivo. Puedo buscar productos, explicar categorías y ayudarte a preparar tu compra. Yo no confirmo pedidos.';

/** Convierte un precio numérico a palabras para síntesis de voz */
function priceToWords(text: string): string {
  return text.replace(/\$(\d+)(?:[,.](\d{2}))?/g, (_, int, dec) => {
    const intN = parseInt(int, 10);
    const decN = dec ? parseInt(dec, 10) : 0;
    if (decN === 0) return `${intN} dólares`;
    return `${intN} dólares con ${decN} centavos`;
  });
}

/** Elimina markdown y emojis para lectura en voz */
function cleanForSpeech(text: string): string {
  return priceToWords(
    text
      .replace(/[*_`#>|]/g, '')
      .replace(/\p{Emoji}/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

export function useAssistant() {
  const { user } = useAuth();
  const { prefs, announce } = useAccessibility();
  const { cart } = useShop();
  const catalogKind = catalogKindForUser(user);
  const needs = needsForUser(user);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: WELCOME,
      suggestions: ['¿Qué productos hay?', 'Buscar agua', '¿Cómo agrego al carrito?', '¿Cómo compro?'] },
  ]);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [speechState, setSpeech]  = useState<SpeechState>('idle');
  const [ttsEnabled, setTts]      = useState(
    () => needs.includes('visual') || prefs.readContent
  );
  const [ttsSpeed, setTtsSpeed]   = useState(1.0);
  const [lastText, setLastText]   = useState('');

  const synthRef  = useRef<SpeechSynthesis | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef  = useRef<any>(null);

  /* ── soporte de APIs de voz ── */
  const supportsSpeech = useMemo(() =>
    typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window, []);
  const supportsRec = useMemo(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window), []);

  useEffect(() => {
    if (supportsSpeech) synthRef.current = window.speechSynthesis;
    return () => synthRef.current?.cancel();
  }, [supportsSpeech]);

  /* ── TTS: leer texto ── */
  const speak = useCallback((text: string, speed = ttsSpeed) => {
    if (!supportsSpeech || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(cleanForSpeech(text));
    utt.lang  = 'es-EC';
    utt.rate  = speed;
    synthRef.current.speak(utt);
    setLastText(text);
  }, [supportsSpeech, ttsSpeed]);

  const pauseTts  = useCallback(() => synthRef.current?.pause(),  []);
  const resumeTts = useCallback(() => synthRef.current?.resume(), []);
  const stopTts   = useCallback(() => synthRef.current?.cancel(), []);
  const repeatLast = useCallback(() => { if (lastText) speak(lastText); }, [speak, lastText]);

  /* ── STT: reconocimiento de voz ── */
  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!supportsRec) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: new () => SpeechRecognitionAPI = ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);
    if (!SR) return;
    const rec: SpeechRecognitionAPI = new SR();
    rec.lang  = 'es-EC';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recogRef.current = rec;
    setSpeech('listening');
    announce('Escuchando…');
    rec.onresult = (e: SpeechRecognitionEventAny) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      announce(`Te escuché: ${transcript}`);
      setSpeech('idle');
      onResult(transcript);
    };
    rec.onerror = () => {
      setSpeech('error');
      announce('No se pudo escuchar. Inténtalo de nuevo.');
    };
    rec.onend = () => setSpeech('idle');
    rec.start();
  }, [supportsRec, announce]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setSpeech('idle');
  }, []);

  /* ── contexto para el asistente ── */
  const context = useMemo(() => ({ user, prefs, catalogKind }), [user, prefs, catalogKind]);

  /* ── enviar mensaje ── */
  const send = useCallback(async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setError('');

    // Comandos locales
    const q = text.toLowerCase();
    if (q === 'repite' || q === 'repite eso') {
      repeatLast();
      return;
    }
    if (q.startsWith('añadir ') || q.startsWith('agregar ')) {
      const name = text.replace(/^(añadir|agregar)\s+/i, '');
      announce(`Intentando agregar ${name} al carrito.`);
    }

    setMessages(cur => [...cur, { id: `user-${Date.now()}`, role: 'user', text }]);
    setBusy(true);
    try {
      const answer = await askAssistant(text, context);
      const msg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: answer.text,
        suggestions: answer.suggestions,
        mode: answer.mode,
      };
      setMessages(cur => [...cur, msg]);
      announce('El Asistente Inclusivo ha respondido.');
      if (ttsEnabled) speak(answer.text);
    } catch {
      setError('El asistente no pudo responder. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [busy, context, announce, ttsEnabled, speak, repeatLast]);

  return {
    messages, send, busy, error, catalogKind, prefs, user, cart,
    speechState, supportsRec, supportsSpeech,
    ttsEnabled, setTts, ttsSpeed, setTtsSpeed,
    startListening, stopListening, speak, pauseTts, resumeTts, stopTts, repeatLast,
  };
}
