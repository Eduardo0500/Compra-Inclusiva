import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../../app/Router';
import { DEFAULT_PREFERENCES } from '../../types/accessibility';
import type { DisabilityType, User } from '../../types/user';

function seedUser(disabilities: DisabilityType[]) {
  const user: User = {
    id: 'u-flow',
    name: 'Persona Prueba',
    email: 'flujo@example.com',
    role: 'user',
    disabilities,
    disabilityConsent: true,
    accessibilityPreferences: DEFAULT_PREFERENCES,
    cart: {},
    orders: [],
  };
  localStorage.setItem('compra-facil:user-registry', JSON.stringify([user]));
  sessionStorage.setItem('compra-facil:session-user-id', JSON.stringify(user.id));
}

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<AppRouter />);
}

describe('flujo autenticado', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '<div id="live-region"></div>';
  });

  it('muestra el catálogo correspondiente al perfil', async () => {
    seedUser(['motriz']);
    renderAt('/catalog/motriz');
    expect(await screen.findByRole('heading', { name: 'Catálogo motriz' })).toBeInTheDocument();
  });

  it('redirige una URL de catálogo incorrecta al perfil real', async () => {
    seedUser(['visual']);
    renderAt('/catalog/general');
    expect(await screen.findByRole('heading', { name: 'Catálogo visual' })).toBeInTheDocument();
  });

  it('agrega productos al carrito desde el catálogo', async () => {
    seedUser(['motriz']);
    renderAt('/catalog/motriz');
    const buttons = await screen.findAllByRole('button', { name: /agregar .+ al carrito/i });
    await userEvent.click(buttons[0]);
    expect(await screen.findByRole('link', { name: /Mi carrito \(1\)/i })).toBeInTheDocument();
  });
});
