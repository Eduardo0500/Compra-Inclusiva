import { formatPrice, getCategories, getAllProducts, queryProducts } from './catalog';
import { needsForUser, needsLabel, type CatalogKind } from './identity';
import type { AccessibilityPreferences } from '../types/accessibility';
import type { User } from '../types/user';

export interface AssistantContext {
  user: User | null;
  prefs: AccessibilityPreferences;
  catalogKind: CatalogKind;
}

export interface AssistantAnswer {
  text: string;
  suggestions: string[];
  mode: 'demo' | 'api' | 'fallback';
}

const normalize = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

function short(answer: string, context: AssistantContext): string {
  if (!context.prefs.simpleLanguage && !context.user?.disabilities.includes('cognitiva')) return answer;
  const first = answer.split(/(?<=[.!?])\s/)[0] ?? answer;
  return first.length > 160 ? `${first.slice(0, 157).trim()}...` : first;
}

function productAnswer(question: string): string | null {
  const clean = normalize(question);
  const matches = queryProducts({ search: question, availableOnly: true });
  const byName = matches.slice(0, 4);
  if (byName.length === 0) return null;
  const details = byName.map((product) =>
    `${product.name}: ${formatPrice(product.price)}. ${product.simpleDescription} Disponible: ${product.available && product.stock > 0 ? 'sí' : 'no'}.`
  ).join(' ');
  if (clean.includes('precio') || clean.includes('cuesta') || clean.includes('costo')) {
    return `Precios: ${byName.map((p) => `${p.name}, ${formatPrice(p.price)}`).join('; ')}.`;
  }
  if (clean.includes('recomien') || clean.includes('sugie')) {
    const cheapest = [...getAllProducts()].filter((p) => p.available && p.stock > 0).sort((a, b) => a.price - b.price)[0];
    return `Te recomiendo ${cheapest.name} por ${formatPrice(cheapest.price)}. También tienes ${byName[0].name} por ${formatPrice(byName[0].price)}.`;
  }
  return `Encontré ${byName.length} producto${byName.length === 1 ? '' : 's'}. ${details}`;
}

export function demoAnswer(question: string, context: AssistantContext): AssistantAnswer {
  const clean = normalize(question.trim());
  const needs = needsForUser(context.user);
  const suggestions = ['¿Qué productos hay?', 'Buscar agua', '¿Cómo agrego al carrito?', '¿Cómo compro?'];
  let text = 'Puedo ayudarte a buscar productos, explicar categorías y preparar tu compra. Escribe, por ejemplo, "buscar jabón".';

  if (!clean) {
    text = 'Escribe una pregunta sobre los productos o la compra.';
  } else if (/hola|buenas|ayuda|que puedes hacer|quien eres/.test(clean)) {
    text = 'Hola, soy el Asistente Inclusivo. Puedo buscar productos, dar precios, explicar categorías y guiarte para agregar productos al carrito. No realizo compras por ti.';
  } else if (/categoria|categorias|que hay|productos hay|ver todo|catalogo/.test(clean)) {
    text = `Tenemos ${getCategories().length} categorías: ${getCategories().join(', ')}. Todos los productos están disponibles en tu catálogo.`;
  } else if (/carrito|agregar|anadir|añadir/.test(clean) && !/comprar|pagar|confirmar|pedido/.test(clean)) {
    text = 'Para agregar un producto: abre su tarjeta, pulsa «Agregar al carrito» y verifica el aviso en pantalla. Después abre «Mi carrito» para cambiar cantidades.';
  } else if (/comprar|compro|comprare|pagar|checkout|pedido|confirmar|entrega/.test(clean)) {
    text = 'La compra tiene 7 pasos: revisar el carrito, confirmar cantidades, escribir la dirección, elegir el pago, revisar el resumen, confirmar y ver la constancia. Yo no confirmo pedidos: debes pulsar «Confirmar pedido» tú mismo. El pago es de demostración.';
  } else if (/accesibilidad|lenguaje|contraste|texto|botones|subtitul/.test(clean)) {
    text = `Tu catálogo es ${context.catalogKind}. Puedes cambiar alto contraste, tamaño de texto, botones grandes, subtítulos y más desde el botón de accesibilidad o desde Mi perfil. Necesidades declaradas: ${needsLabel(needs)}.`;
  } else if (/barato|economico|recomienda|recomendar|mas barato/.test(clean)) {
    text = productAnswer('recomendar') ?? 'No encontré productos disponibles.';
  } else {
    text = productAnswer(question) ?? 'No encontré ese producto. Prueba con «agua», «jabón», «limpieza» o pregunta por las categorías.';
  }

  if (context.prefs.captions || context.user?.disabilities.includes('auditiva')) {
    text += ' Esta respuesta también está disponible como texto.';
  }
  if (context.catalogKind === 'visual' || context.catalogKind === 'combinado') {
    text = `Información para lector de pantalla. ${text}`;
  }
  return { text: short(text, context), suggestions, mode: 'demo' };
}

export async function askAssistant(question: string, context: AssistantContext): Promise<AssistantAnswer> {
  const endpoint = import.meta.env.VITE_AI_API_URL;
  if (!endpoint) return demoAnswer(question, context);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        profile: {
          catalogKind: context.catalogKind,
          needs: needsForUser(context.user),
          preferences: context.prefs,
        },
        catalog: getAllProducts().map(({ id, name, description, price, category, available, stock }) =>
          ({ id, name, description, price, category, available, stock })),
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { answer?: string; suggestions?: string[] };
    if (!data.answer) throw new Error('Respuesta vacía');
    return {
      text: short(data.answer, context),
      suggestions: Array.isArray(data.suggestions) ? data.suggestions.slice(0, 4) : [],
      mode: 'api',
    };
  } catch {
    const fallback = demoAnswer(question, context);
    return { ...fallback, text: `El servicio de IA no está disponible. ${fallback.text}`, mode: 'fallback' };
  }
}
