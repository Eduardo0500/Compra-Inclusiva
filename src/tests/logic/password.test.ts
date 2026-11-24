import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DEMO_PASSWORD_HASH, hashPassword, verifyPassword } from '../../services/password';

describe('contraseñas de demostración', () => {
  it('el hash demo usa PBKDF2 con iteraciones explícitas', () => {
    const parts = DEMO_PASSWORD_HASH.split('$');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('pbkdf2');
    expect(parts[2]).toBe('120000');
  });

  it('valida la contraseña demo y rechaza una incorrecta', async () => {
    if (typeof globalThis.crypto?.subtle?.deriveBits !== 'function') return;
    expect(await verifyPassword(DEMO_PASSWORD, DEMO_PASSWORD_HASH)).toBe(true);
    expect(await verifyPassword('Incorrecta123!', DEMO_PASSWORD_HASH)).toBe(false);
  });

  it('guarda las contraseñas nuevas en un formato verificable', async () => {
    if (typeof globalThis.crypto?.subtle?.deriveBits !== 'function') return;
    const stored = await hashPassword('ClaveNueva123!');
    expect(stored.split('$')).toHaveLength(4);
    expect(stored.split('$')[2]).toBe('120000');
    expect(await verifyPassword('ClaveNueva123!', stored)).toBe(true);
    expect(await verifyPassword('OtraClave123!', stored)).toBe(false);
  });

  it('permite iniciar sesión con cuentas creadas con el formato anterior', async () => {
    if (typeof globalThis.crypto?.subtle?.deriveBits !== 'function') return;
    const [scheme, salt, iterations, hash] = (await hashPassword('ClaveLegacy123!')).split('$');
    const legacy = `${scheme}$${salt}$$${iterations}$${hash}`;
    expect(await verifyPassword('ClaveLegacy123!', legacy)).toBe(true);
    expect(await verifyPassword('Incorrecta123!', legacy)).toBe(false);
  });

  it('permite verificar contraseñas nuevas sin Web Crypto completo', async () => {
    const original = globalThis.crypto;
    const cryptoWithSubtle = original && typeof original.subtle?.deriveBits === 'function';
    if (cryptoWithSubtle) return;
    const stored = await hashPassword('MiClaveSegura');
    expect(stored.startsWith('demo-fallback$')).toBe(true);
    expect(await verifyPassword('MiClaveSegura', stored)).toBe(true);
    expect(await verifyPassword('OtraClave', stored)).toBe(false);
  });
});
