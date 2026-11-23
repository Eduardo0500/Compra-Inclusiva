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
