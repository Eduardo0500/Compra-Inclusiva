const ITERATIONS = 120000;
const DEMO_HASH = 'pbkdf2$dceb49ca66288abbf3a71e9a4cf2bb8a$120000$f8ebbdd64d1194cc31a9276a019926dafb2eb5682a9b55c7cd64c4d7f56f21ce';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return `pbkdf2$${toHex(salt)}$${ITERATIONS}$${await derive(password, salt, ITERATIONS)}`;
  } catch {
    return `demo-fallback$${toHex(new TextEncoder().encode(password).slice(0, 16))}`;
  }
}

function parsePbkdf2(stored: string): { salt: Uint8Array; iterations: number; hash: string } | null {
  const parts = stored.split('$');
  const legacy = parts.length === 5 && parts[2] === '';
  const saltHex = parts[1];
  const iterationsRaw = legacy ? parts[3] : parts[2];
  const hash = legacy ? parts[4] : parts[3];
  if (!saltHex || !iterationsRaw || !hash) return null;
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations <= 0) return null;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
  if (!salt.length || salt.some(Number.isNaN)) return null;
  return { salt, iterations, hash };
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('pbkdf2$')) {
    const parsed = parsePbkdf2(stored);
    if (!parsed || !globalThis.crypto?.subtle?.importKey) return false;
    try {
      const calculated = await derive(password, parsed.salt, parsed.iterations);
      return calculated === parsed.hash;
    } catch {
      return false;
    }
  }
  if (stored.startsWith('demo-fallback$')) {
    const bytes = toHex(new TextEncoder().encode(password).slice(0, 16));
    return stored === `demo-fallback$${bytes}`;
  }
  const bytes = new TextEncoder().encode(`compra-inclusiva-demo:${password}`);
  if (!globalThis.crypto?.subtle?.digest) return false;
  try {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return toHex(new Uint8Array(digest)) === stored;
  } catch {
    return false;
  }
}

export const DEMO_PASSWORD = 'Demo1234!';
export const DEMO_PASSWORD_HASH = DEMO_HASH;
