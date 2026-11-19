import type { AccessibilityPreferences } from './accessibility';

/** Tipos de discapacidad declarados en el registro (opcional, con consentimiento) */
export type DisabilityType = 'visual' | 'auditiva' | 'motriz' | 'cognitiva' | 'ninguna';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Declarado libremente en el registro; null = no declarado */
  disability: DisabilityType | null;
  /** Consentimiento explícito para guardar datos de discapacidad */
  disabilityConsent: boolean;
  /** Preferencias guardadas; se aplican al hacer login */
  accessibilityPreferences: AccessibilityPreferences;
}
