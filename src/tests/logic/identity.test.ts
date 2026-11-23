import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES } from '../../types/accessibility';
import type { DisabilityType, User } from '../../types/user';
import {
  catalogKindForNeeds,
  catalogKindForUser,
  needsForUser,
  recommendationsForNeeds,
} from '../../services/identity';

function makeUser(disabilities: DisabilityType[], consent = true): User {
  return {
    id: 'u-1',
    name: 'Prueba',
    email: 'prueba@example.com',
    role: 'user',
    disabilities,
    disabilityConsent: consent,
    accessibilityPreferences: DEFAULT_PREFERENCES,
  };
}

describe('identificación de perfiles y catálogos', () => {
  it('respeta el consentimiento antes de usar necesidades declaradas', () => {
    expect(needsForUser(makeUser(['visual', 'motriz'], false))).toEqual([]);
    expect(catalogKindForUser(makeUser(['visual', 'motriz'], false))).toBe('general');
  });

  it('envía "cognitiva" al catálogo cognitivo', () => {
    expect(needsForUser(makeUser(['cognitiva']))).toEqual(['cognitiva']);
    expect(catalogKindForNeeds(['cognitiva'])).toBe('cognitivo');
  });

  it('combina varias necesidades en el catálogo combinado', () => {
    expect(catalogKindForUser(makeUser(['visual', 'auditiva', 'motriz']))).toBe('combinado');
  });

  it('usa catálogo general para "ninguna", "no_indica" y sin datos', () => {
    expect(catalogKindForNeeds(['ninguna'])).toBe('general');
    expect(catalogKindForNeeds(['no_indica'])).toBe('general');
    expect(catalogKindForNeeds([])).toBe('general');
    expect(catalogKindForUser(null)).toBe('general');
  });

  it('recomienda herramientas para cada necesidad y conserva las Manuales', () => {
    const prefs = recommendationsForNeeds(['visual', 'auditiva']);
    expect(prefs.highContrast).toBe(true);
    expect(prefs.captions).toBe(true);
    expect(prefs.visualAlerts).toBe(true);
    expect(prefs.colorMode).toBe('normal');
  });
});
