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

  it('permite iniciar sesión con las credenciales recién creadas', async () => {
    const user = userEvent.setup();
    renderAt('/register');
    await user.type(await screen.findByLabelText(/nombre completo/i), 'Nueva Persona');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'nueva@example.com');
    const passwordFields = screen.getAllByLabelText(/contraseña/i);
    await user.type(passwordFields[0], 'NuevaClave123!');
    await user.type(passwordFields[1], 'NuevaClave123!');
    await user.click(screen.getByRole('button', { name: /continuar a necesidades/i }));
    // Paso 2: sin discapacidades, el botón continúa directo a confirmación
    await user.click(await screen.findByRole('button', { name: /continuar/i }));
    await user.click(await screen.findByRole('button', { name: /crear cuenta/i }));
    expect(await screen.findByRole('heading', { name: /registro completado/i })).toBeInTheDocument();
    expect(screen.getByText('nueva@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña creada/i)).toHaveValue('NuevaClave123!');
    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }));
    expect(screen.getByLabelText(/contraseña creada/i)).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('link', { name: /ir a iniciar sesión/i }));
    expect(await screen.findByLabelText(/correo electrónico/i)).toHaveValue('nueva@example.com');
    expect(screen.getByLabelText(/contraseña/i)).toHaveValue('NuevaClave123!');
    await user.click(screen.getByRole('button', { name: /entrar a mi catálogo/i }));
    expect(await screen.findByRole('heading', { name: 'Catálogo general' })).toBeInTheDocument();
  });
});
