import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES } from '../../types/accessibility';
import type { User } from '../../types/user';
import { demoAnswer } from '../../services/assistant';

const user: User = {
  id: 'u-1',
  name: 'Prueba',
  email: 'prueba@example.com',
  role: 'user',
  disabilities: [],
  disabilityConsent: false,
  accessibilityPreferences: DEFAULT_PREFERENCES,
};

const context = { user, prefs: DEFAULT_PREFERENCES, catalogKind: 'general' as const };

describe('Asistente Inclusivo en modo demostración', () => {
  it('busca productos usando el catálogo real', async () => {
    const answer = await demoAnswer('buscar agua', context);
    expect(answer.text.toLowerCase()).toContain('agua');
    expect(answer.mode).toBe('demo');
  });

  it('explica los pasos de compra sin confirmar pedidos', async () => {
    const answer = await demoAnswer('¿cómo compro?', context);
    expect(answer.text).toContain('7 pasos');
    expect(answer.text.toLowerCase()).toContain('no confirmo pedidos');
  });

  it('ofrece preguntas sugeridas', async () => {
    const answer = await demoAnswer('hola', context);
    expect(answer.suggestions.length).toBeGreaterThan(0);
  });
});
