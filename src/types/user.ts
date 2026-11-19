import type { AccessibilityPreferences } from './accessibility';

/** Tipos de discapacidad declarados en el registro (opcional, con consentimiento) */
export type DisabilityType = 'visual' | 'auditiva' | 'motriz' | 'cognitiva' | 'ninguna';

/** Rol del usuario en el sistema */
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Declarado libremente en el registro; null = no declarado */
  disability: DisabilityType | null;
  /** Consentimiento explícito para guardar datos de discapacidad */
  disabilityConsent: boolean;
  /** Preferencias guardadas; se aplican al hacer login */
  accessibilityPreferences: AccessibilityPreferences;
  /** Fecha/hora de registro (opcional por compatibilidad con datos anteriores) */
  registeredAt?: string;
}
