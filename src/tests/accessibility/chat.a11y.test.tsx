/**
 * Tests de accesibilidad del chat/asistente.
 * Verifica WCAG 4.1.3 (aria-live), atajos Alt+C / Escape / Enter.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssistantWidget } from '../../features/chat/AssistantWidget';
import { AccessibilityProvider } from '../../app/AccessibilityContext';
import { MemoryRouter } from 'react-router-dom';

// Stub mínimo de ShopContext y AuthContext para que el widget se muestre
vi.mock('../../app/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: null, login: vi.fn(), logout: vi.fn(), isAdmin: false, updateUser: vi.fn() }),
  useOptionalAuth: () => ({ isAuthenticated: true, user: null }),
}));

vi.mock('../../app/ShopContext', () => ({
  useShop: () => ({
    cart: {}, addToCart: vi.fn(), setQuantity: vi.fn(), removeFromCart: vi.fn(),
    clearCart: vi.fn(), subtotal: 0, cartCount: 0, createOrder: vi.fn(),
  }),
}));

vi.mock('../../services/assistant', () => ({
  askAssistant: vi.fn().mockResolvedValue({
    text: 'Respuesta de prueba del asistente.',
    suggestions: [],
    mode: 'demo',
  }),
}));

function renderWidget() {
  document.body.innerHTML = '';
  const region = document.createElement('div');
  region.id = 'live-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);

  return render(
    <MemoryRouter>
      <AccessibilityProvider>
        <AssistantWidget />
      </AccessibilityProvider>
    </MemoryRouter>
  );
}

describe('AssistantWidget accesibilidad', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('el log de conversación tiene role="log" y aria-live="polite" (WCAG 4.1.3)', () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }));
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
  });

  it('abre el chat con Alt+C', () => {
    renderWidget();
    act(() => { fireEvent.keyDown(window, { key: 'c', altKey: true }); });
    expect(screen.getByRole('dialog', { name: /asistente inclusivo/i })).toBeInTheDocument();
  });

  it('cierra el chat con Escape', () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }));
    const panel = screen.getByRole('dialog');
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('el campo de entrada tiene label visible (WCAG 1.3.1)', () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }));
    expect(screen.getByLabelText(/tu pregunta/i)).toBeInTheDocument();
  });

  it('los mensajes tienen prefijo sr-only para lectores (WCAG 1.3.1)', () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }));
    // El mensaje de bienvenida debe tener el prefijo
    const prefix = screen.getAllByText(/asistente dijo:/i);
    expect(prefix.length).toBeGreaterThan(0);
  });

  it('el botón de cerrar tiene aria-label', () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }));
    expect(screen.getByRole('button', { name: /cerrar asistente inclusivo/i })).toBeInTheDocument();
  });
});
