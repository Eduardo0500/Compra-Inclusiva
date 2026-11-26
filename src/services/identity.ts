import { DEFAULT_PREFERENCES, type AccessibilityPreferences } from '../types/accessibility';
import type { DisabilityType, User } from '../types/user';

export type CatalogKind = 'visual' | 'auditivo' | 'motriz' | 'cognitivo' | 'combinado' | 'general';
export type AccessibilityNeed = Exclude<DisabilityType, 'ninguna' | 'no_indica'>;
export type AccessibilityTool =
  | 'highContrast'
  | 'textScale'
  | 'largeButtons'
  | 'captions'
  | 'signLanguage'
  | 'visualAlerts'
  | 'simpleLanguage'
  | 'extraSpacing'
  | 'readContent'
  | 'keyboardNavigation'
  | 'colorMode';

export const DISABILITY_OPTIONS: { value: DisabilityType; label: string; short: string }[] = [
  { value: 'visual', label: 'Discapacidad visual', short: 'Visual' },
  { value: 'auditiva', label: 'Discapacidad auditiva', short: 'Auditiva' },
  { value: 'motriz', label: 'Discapacidad motriz', short: 'Motriz' },
  { value: 'cognitiva', label: 'Discapacidad cognitiva', short: 'Cognitiva' },
  { value: 'ninguna', label: 'Sin discapacidad', short: 'Sin discapacidad' },
  { value: 'no_indica', label: 'Prefiero no indicarlo', short: 'Prefiero no indicarlo' },
];

export const CATALOG_KIND_LABELS: Record<CatalogKind, string> = {
  visual: 'Catálogo visual',
  auditivo: 'Catálogo auditivo',
  motriz: 'Catálogo motriz',
  cognitivo: 'Catálogo cognitivo',
  combinado: 'Catálogo combinado',
  general: 'Catálogo general',
};

export const RECOMMENDED_TOOLS: Record<AccessibilityNeed, AccessibilityTool[]> = {
  visual: ['highContrast', 'textScale', 'readContent', 'keyboardNavigation'],
  auditiva: ['captions', 'signLanguage', 'visualAlerts'],
  motriz: ['largeButtons', 'extraSpacing', 'keyboardNavigation'],
  cognitiva: ['simpleLanguage', 'extraSpacing', 'keyboardNavigation'],
};

function realNeeds(disabilities: readonly DisabilityType[] = []): AccessibilityNeed[] {
  return disabilities.filter(
    (item): item is AccessibilityNeed =>
      item === 'visual' || item === 'auditiva' || item === 'motriz' || item === 'cognitiva'
  );
}

export function needsForUser(user: Pick<User, 'disabilities' | 'disabilityConsent' | 'disability'> | null): AccessibilityNeed[] {
  if (!user) return [];
  const declared = Array.isArray(user.disabilities) && user.disabilities.length
    ? user.disabilities
    : user.disability
      ? [user.disability]
      : [];
  return user.disabilityConsent ? realNeeds(declared) : [];
}

export function catalogKindForNeeds(needs: readonly DisabilityType[]): CatalogKind {
  const filtered = realNeeds([...needs]);
  const unique = [...new Set(filtered)];
  if (unique.length > 1) return 'combinado';
  if (unique.length === 0) return 'general';
  if (unique[0] === 'auditiva') return 'auditivo';
  if (unique[0] === 'motriz') return 'motriz';
  if (unique[0] === 'cognitiva') return 'cognitivo';
  return 'visual';
}

export function catalogKindForUser(user: Pick<User, 'disabilities' | 'disabilityConsent' | 'disability'> | null): CatalogKind {
  return catalogKindForNeeds(needsForUser(user));
}

export function recommendedToolsForNeeds(needs: readonly DisabilityType[]): AccessibilityTool[] {
  const unique = realNeeds([...needs]);
  const tools = new Set<AccessibilityTool>();
  unique.forEach((need) => RECOMMENDED_TOOLS[need].forEach((tool) => tools.add(tool)));
  return [...tools];
}

export function recommendationsForNeeds(needs: readonly DisabilityType[]): AccessibilityPreferences {
  const result: AccessibilityPreferences = { ...DEFAULT_PREFERENCES };
  const unique = realNeeds([...needs]);
  if (unique.includes('visual')) {
    result.highContrast = true;
    result.textScale = 1.5;
    result.readContent = true;
    result.keyboardNavigation = true;
  }
  if (unique.includes('auditiva')) {
    result.captions = true;
    result.signLanguage = true;
    result.visualAlerts = true;
  }
  if (unique.includes('motriz')) {
    result.largeButtons = true;
    result.extraSpacing = true;
    result.keyboardNavigation = true;
  }
  if (unique.includes('cognitiva')) {
    result.simpleLanguage = true;
    result.extraSpacing = true;
    result.keyboardNavigation = true;
  }
  return result;
}

export function applyRecommendations(
  current: AccessibilityPreferences,
  needs: readonly DisabilityType[]
): AccessibilityPreferences {
  const recommended = recommendationsForNeeds(needs);
  return {
    ...current,
    highContrast: current.highContrast || recommended.highContrast,
    largeButtons: current.largeButtons || recommended.largeButtons,
    captions: current.captions || recommended.captions,
    signLanguage: current.signLanguage || recommended.signLanguage,
    visualAlerts: current.visualAlerts || recommended.visualAlerts,
    simpleLanguage: current.simpleLanguage || recommended.simpleLanguage,
    extraSpacing: current.extraSpacing || recommended.extraSpacing,
    readContent: current.readContent || recommended.readContent,
    keyboardNavigation: current.keyboardNavigation || recommended.keyboardNavigation,
    textScale: Math.max(current.textScale, recommended.textScale) as AccessibilityPreferences['textScale'],
  };
}

export function disabilityLabel(value: DisabilityType): string {
  return DISABILITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function needsLabel(needs: readonly DisabilityType[]): string {
  const unique = realNeeds([...needs]);
  if (!unique.length) return 'Sin necesidades declaradas';
  return [...new Set(unique)].map((need) => disabilityLabel(need)).join(', ');
}

export function isRecommendationActive(
  tool: AccessibilityTool,
  value: boolean,
  needs: readonly DisabilityType[]
): boolean {
  return value && recommendedToolsForNeeds(needs).includes(tool);
}

export const TOOL_LABELS: Record<AccessibilityTool, string> = {
  highContrast: 'Alto contraste',
  textScale: 'Texto ampliable',
  largeButtons: 'Botones grandes',
  captions: 'Subtítulos',
  signLanguage: 'Lengua de señas',
  visualAlerts: 'Alertas visuales',
  simpleLanguage: 'Lenguaje sencillo',
  extraSpacing: 'Mayor espaciado',
  readContent: 'Lectura de contenido',
  keyboardNavigation: 'Navegación por teclado',
  colorMode: 'Cambiar colores',
};

export const TOOL_DESCRIPTIONS: Record<AccessibilityTool, string> = {
  highContrast: 'Colores con contraste reforzado.',
  textScale: 'Aumenta o reduce el tamaño del texto.',
  largeButtons: 'Botones y controles más grandes.',
  captions: 'Muestra subtítulos en multimedia.',
  signLanguage: 'Muestra intérprete de lengua de señas cuando exista.',
  visualAlerts: 'Avisos visibles además de sonidos.',
  simpleLanguage: 'Frases cortas y palabras sencillas.',
  extraSpacing: 'Más espacio entre elementos.',
  readContent: 'Permite escuchar el contenido.',
  keyboardNavigation: 'Mejora la navegación con teclado.',
  colorMode: 'Cambia la combinación de colores.',
};

export const ALL_TOOLS: AccessibilityTool[] = [
  'textScale',
  'highContrast',
  'colorMode',
  'largeButtons',
  'extraSpacing',
  'readContent',
  'keyboardNavigation',
  'simpleLanguage',
  'captions',
  'signLanguage',
  'visualAlerts',
];

export interface ToolCategory {
  id: 'visual' | 'auditiva' | 'motriz' | 'cognitiva';
  label: string;
  icon: string;
  tools: AccessibilityTool[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'visual',
    label: 'Visual',
    icon: '👁',
    tools: ['textScale', 'highContrast', 'colorMode', 'readContent'],
  },
  {
    id: 'auditiva',
    label: 'Auditiva',
    icon: '👂',
    tools: ['captions', 'signLanguage', 'visualAlerts'],
  },
  {
    id: 'motriz',
    label: 'Motriz',
    icon: '🖐',
    tools: ['largeButtons', 'extraSpacing', 'keyboardNavigation'],
  },
  {
    id: 'cognitiva',
    label: 'Cognitiva',
    icon: '🧠',
    tools: ['simpleLanguage', 'extraSpacing', 'keyboardNavigation'],
  },
];

/** Calcula el nivel funcional a partir de las respuestas de un cuestionario.
 *  respuestas: array de 5 valores 0–3.
 *  Retorna: score (suma 0-15), level ('leve' | 'moderado' | 'alto') y los answers originales.
 */
export function calcularNivel(respuestas: number[]): {
  score: number;
  level: 'leve' | 'moderado' | 'alto';
  answers: number[];
} {
  const score = respuestas.reduce((acc, v) => acc + Math.min(3, Math.max(0, v)), 0);
  const level: 'leve' | 'moderado' | 'alto' =
    score <= 3 ? 'leve' : score <= 8 ? 'moderado' : 'alto';
  return { score, level, answers: [...respuestas] };
}

/* ── Cuestionario de nivel de discapacidad (Tarea 4) ─────────────────────── */

export type DisabilityNeedKey = 'visual' | 'auditiva' | 'motriz' | 'cognitiva';

export interface LevelQuestion {
  id: string;
  text: string;
}

export const LEVEL_QUESTIONS: Record<DisabilityNeedKey, LevelQuestion[]> = {
  visual: [
    { id: 'v1', text: '¿Leer texto normal en pantalla te resulta difícil?' },
    { id: 'v2', text: '¿Distinguir colores y botones te cuesta esfuerzo?' },
    { id: 'v3', text: '¿Reconocer imágenes o fotos de productos te resulta difícil?' },
    { id: 'v4', text: '¿Moverte por una página web sin ver el cursor te resulta difícil?' },
    { id: 'v5', text: '¿Necesitas que el contenido te sea leído en voz alta?' },
  ],
  auditiva: [
    { id: 'a1', text: '¿Entender audios o videos sin subtítulos te resulta difícil?' },
    { id: 'a2', text: '¿Notar avisos sonoros del celular o computador te resulta difícil?' },
    { id: 'a3', text: '¿Hablar por llamada telefónica te resulta difícil?' },
    { id: 'a4', text: '¿Entender a alguien que te habla sin leer sus labios te resulta difícil?' },
    { id: 'a5', text: '¿Necesitas intérprete de lengua de señas para comunicarte?' },
  ],
  motriz: [
    { id: 'm1', text: '¿Usar el mouse o el dedo con precisión te resulta difícil?' },
    { id: 'm2', text: '¿Tocar botones pequeños en pantalla te resulta difícil?' },
    { id: 'm3', text: '¿Escribir en el teclado te resulta difícil?' },
    { id: 'm4', text: '¿Mantener el pulso firme al hacer clic te resulta difícil?' },
    { id: 'm5', text: '¿Necesitas más tiempo del habitual para completar formularios?' },
  ],
  cognitiva: [
    { id: 'c1', text: '¿Entender textos largos o con palabras difíciles te resulta complicado?' },
    { id: 'c2', text: '¿Recordar los pasos de un proceso largo te resulta difícil?' },
    { id: 'c3', text: '¿Concentrarte cuando hay muchos elementos en pantalla te resulta difícil?' },
    { id: 'c4', text: '¿Completar un formulario sin ayuda te resulta difícil?' },
    { id: 'c5', text: '¿Necesitas instrucciones paso a paso para realizar tareas en la app?' },
  ],
};

export const LEVEL_ANSWERS = [
  { value: 0, label: 'Sin dificultad' },
  { value: 1, label: 'Algo de dificultad' },
  { value: 2, label: 'Mucha dificultad' },
  { value: 3, label: 'No puedo hacerlo' },
];

export const LEVEL_LABELS: Record<'leve' | 'moderado' | 'alto', string> = {
  leve:     'Leve',
  moderado: 'Moderado',
  alto:     'Alto',
};
