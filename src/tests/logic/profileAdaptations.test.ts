import { describe, expect, it } from 'vitest';
import { getCheckoutAdaptation } from '../../features/checkout/profileAdaptations';
import type { AccessibilityNeed } from '../../services/identity';

describe('getCheckoutAdaptation', () => {
  it('devuelve reuseData=true para todos los perfiles', () => {
    expect(getCheckoutAdaptation([]).reuseData).toBe(true);
    expect(getCheckoutAdaptation(['visual']).reuseData).toBe(true);
  });

  it('activa moveFocusOnStep y announceStepSummary para visual', () => {
    const a = getCheckoutAdaptation(['visual'] as AccessibilityNeed[]);
    expect(a.moveFocusOnStep).toBe(true);
    expect(a.announceStepSummary).toBe(true);
    expect(a.enhancedErrors).toBe(true);
  });

  it('activa visualOnly para auditiva', () => {
    const a = getCheckoutAdaptation(['auditiva'] as AccessibilityNeed[]);
    expect(a.visualOnly).toBe(true);
  });

  it('activa largeTargets y extraSpacing para motriz', () => {
    const a = getCheckoutAdaptation(['motriz'] as AccessibilityNeed[]);
    expect(a.largeTargets).toBe(true);
    expect(a.extraSpacing).toBe(true);
  });

  it('activa simpleMode, stepCounter y confirmationStep para cognitiva', () => {
    const a = getCheckoutAdaptation(['cognitiva'] as AccessibilityNeed[]);
    expect(a.simpleMode).toBe(true);
    expect(a.stepCounter).toBe(true);
    expect(a.confirmationStep).toBe(true);
  });

  it('combina adaptaciones para perfil visual + motriz', () => {
    const a = getCheckoutAdaptation(['visual', 'motriz'] as AccessibilityNeed[]);
    expect(a.moveFocusOnStep).toBe(true);
    expect(a.largeTargets).toBe(true);
  });

  it('nivel alto activa largeTargets aunque la necesidad base no lo haga', () => {
    const a = getCheckoutAdaptation(['visual'] as AccessibilityNeed[], {
      visual: { score: 12, level: 'alto', answers: [3, 3, 3, 2, 1] },
    });
    expect(a.largeTargets).toBe(true);
  });

  it('no activa nada extra para perfil general sin necesidades', () => {
    const a = getCheckoutAdaptation([]);
    expect(a.simpleMode).toBe(false);
    expect(a.largeTargets).toBe(false);
    expect(a.visualOnly).toBe(false);
  });
});
