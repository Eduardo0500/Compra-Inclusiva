/**
 * Preferencias de accesibilidad del usuario.
 * Cubren todas las opciones del menú F3.
 */
export interface AccessibilityPreferences {
  /** 1.4.3 – Alto contraste */
  highContrast: boolean;
  /** 1.4.4 – Factor de escala de texto: 1 = 100 %, 2 = 200 % */
  textScale: 1 | 1.25 | 1.5 | 1.75 | 2;
  /** 2.5.8 – Botones grandes (mínimo 44 × 44 px táctil) */
  largeButtons: boolean;
  /** 1.2.2 / 1.2.4 – Subtítulos activados */
  captions: boolean;
  /** 1.2.6 – Lengua de señas visible */
  signLanguage: boolean;
  /** 1.3.3 / 1.4.1 – Alertas visuales y vibración en lugar de solo sonido */
  visualAlerts: boolean;
  /** 3.1.5 – Lenguaje simple */
  simpleLanguage: boolean;
  extraSpacing: boolean;
  readContent: boolean;
  keyboardNavigation: boolean;
  colorMode: 'normal' | 'blue-yellow';
}

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  textScale: 1,
  largeButtons: false,
  captions: false,
  signLanguage: false,
  visualAlerts: false,
  simpleLanguage: false,
  extraSpacing: false,
  readContent: false,
  keyboardNavigation: false,
  colorMode: 'normal',
};
