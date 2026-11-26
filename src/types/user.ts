import type { AccessibilityPreferences } from './accessibility';

/** Tipos de discapacidad declarados en el registro (opcional, con consentimiento) */
export type DisabilityType =
  | 'visual'
  | 'auditiva'
  | 'motriz'
  | 'cognitiva'
  | 'ninguna'
  | 'no_indica';

/** Rol del usuario en el sistema */
export type UserRole = 'user' | 'admin';

export type DisabilityLevel = 'leve' | 'moderado' | 'alto';

export interface DisabilityLevelData {
  score: number;
  level: DisabilityLevel;
  answers: number[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Selecciones compatibles de discapacidad. Migración de campo antiguo: disability -> disabilities. */
  disabilities: DisabilityType[];
  /** Campo legado conservado solo para migración compatible. */
  disability?: DisabilityType | null;
  /** Consentimiento explícito para guardar datos de discapacidad */
  disabilityConsent: boolean;
  /** Preferencias guardadas; se aplican al hacer login */
  accessibilityPreferences: AccessibilityPreferences;
  /** Fecha/hora de registro (opcional por compatibilidad con datos anteriores) */
  registeredAt?: string;
  /** Hash de demostración, nunca contraseña en texto plano. */
  passwordHash?: string;
  /** Datos personales propios de esta cuenta. */
  deliveryAddress?: {
    fullName?: string;
    address?: string;
    city?: string;
    phone?: string;
  };
  cart?: Record<string, number>;
  orders?: string[];
  /**
   * Niveles funcionales por tipo de discapacidad.
   * Calculados mediante cuestionario de autoreporte en el registro.
   * Opcional: usuarios existentes y demos funcionan sin este campo.
   */
  disabilityLevels?: Partial<Record<'visual' | 'auditiva' | 'motriz' | 'cognitiva', DisabilityLevelData>>;
}
