/**
 * profileAdaptations.ts
 * Configuración de adaptaciones del flujo de compra según el perfil de discapacidad.
 * Se consume en CartPage y CheckoutPage sin duplicar páginas.
 */
import type { DisabilityLevelData } from '../../types/user';
import type { AccessibilityNeed } from '../../services/identity';

export interface CheckoutAdaptation {
  /** Botones y campos a 56px mínimo (motriz / alto) */
  largeTargets: boolean;
  /** Mueve el foco al título de cada paso automáticamente */
  moveFocusOnStep: boolean;
  /** Anuncia el resumen del paso con aria-live al cambiar */
  announceStepSummary: boolean;
  /** Errores con role="alert" y enlace directo al campo */
  enhancedErrors: boolean;
  /** Instrucciones visibles extra en cada paso */
  stepInstructions: boolean;
  /** Solo avisos visuales, nunca solo sonido */
  visualOnly: boolean;
  /** Lenguaje simple, un objetivo por pantalla */
  simpleMode: boolean;
  /** Indicador "Paso X de 7" prominente */
  stepCounter: boolean;
  /** Muestra ejemplos en cada campo */
  fieldExamples: boolean;
  /** Pedir confirmación explícita antes de pagar */
  confirmationStep: boolean;
  /** Más separación entre elementos */
  extraSpacing: boolean;
  /** No pedir datos ya ingresados (WCAG 3.3.7) */
  reuseData: boolean;
}

const BASE: CheckoutAdaptation = {
  largeTargets:        false,
  moveFocusOnStep:     false,
  announceStepSummary: false,
  enhancedErrors:      false,
  stepInstructions:    false,
  visualOnly:          false,
  simpleMode:          false,
  stepCounter:         false,
  fieldExamples:       false,
  confirmationStep:    false,
  extraSpacing:        false,
  reuseData:           true,   // siempre rellenar campos con datos guardados
};

const VISUAL: Partial<CheckoutAdaptation> = {
  moveFocusOnStep:     true,
  announceStepSummary: true,
  enhancedErrors:      true,
  stepInstructions:    true,
};

const AUDITIVA: Partial<CheckoutAdaptation> = {
  visualOnly:       true,
  stepInstructions: true,
};

const MOTRIZ: Partial<CheckoutAdaptation> = {
  largeTargets:  true,
  extraSpacing:  true,
  fieldExamples: true,
};

const COGNITIVA: Partial<CheckoutAdaptation> = {
  simpleMode:       true,
  stepCounter:      true,
  fieldExamples:    true,
  confirmationStep: true,
  stepInstructions: true,
};

/**
 * Combina las adaptaciones para las necesidades del usuario.
 * Si hay un nivel "alto" para una necesidad, activa todas las adaptaciones de esa categoría.
 */
export function getCheckoutAdaptation(
  needs: readonly AccessibilityNeed[],
  levels?: Partial<Record<'visual' | 'auditiva' | 'motriz' | 'cognitiva', DisabilityLevelData>>,
): CheckoutAdaptation {
  const result: CheckoutAdaptation = { ...BASE };

  const merge = (partial: Partial<CheckoutAdaptation>) => {
    (Object.keys(partial) as (keyof CheckoutAdaptation)[]).forEach(k => {
      if (partial[k]) (result as unknown as Record<string, boolean>)[k] = true;
    });
  };

  if (needs.includes('visual'))    merge(VISUAL);
  if (needs.includes('auditiva'))  merge(AUDITIVA);
  if (needs.includes('motriz'))    merge(MOTRIZ);
  if (needs.includes('cognitiva')) merge(COGNITIVA);

  // Nivel alto activa adaptaciones adicionales
  if (levels) {
    if (levels.visual?.level    === 'alto') { merge(VISUAL);    result.largeTargets = true; }
    if (levels.auditiva?.level  === 'alto') { merge(AUDITIVA);  result.visualOnly = true; }
    if (levels.motriz?.level    === 'alto') { merge(MOTRIZ);    result.largeTargets = true; result.extraSpacing = true; }
    if (levels.cognitiva?.level === 'alto') { merge(COGNITIVA); result.simpleMode = true;  result.stepCounter = true; }
  }

  return result;
}
