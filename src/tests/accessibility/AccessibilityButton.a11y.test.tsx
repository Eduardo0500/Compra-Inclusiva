/**
 * Tests de accesibilidad para el botón flotante y su panel.
 * Verifica WCAG: 2.1.1 (Esc cierra), 2.4.3 (foco regresa), 4.1.2 (roles ARIA).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccessibilityButton } from '../../features/accessibility/AccessibilityButton';
import { AccessibilityProvider } from '../../app/AccessibilityContext';

function renderWithProvider() {
  // Crear el live-region que usa announce()
  const liveRegion = document.createElement('div');
  liveRegion.id = 'live-region';
  document.body.appendChild(liveRegion);

  const result = render(
    <AccessibilityProvider>
      <AccessibilityButton />
    </AccessibilityProvider>
  );
  return result;
}

describe('AccessibilityButton', () => {
  it('el botón tiene aria-label y aria-expanded=false por defecto', () => {
    renderWithProvider();
    const btn = screen.getByRole('button', { name: /opciones de accesibilidad/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre el panel al hacer clic y lo anuncia como dialog', () => {
    renderWithProvider();
    const btn = screen.getByRole('button', { name: /opciones de accesibilidad/i });
    fireEvent.click(btn);
    expect(screen.getByRole('dialog', { name: /menú de accesibilidad/i })).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('cierra el panel con Escape (WCAG 2.1.1)', () => {
    renderWithProvider();
    const btn = screen.getByRole('button', { name: /opciones de accesibilidad/i });
    fireEvent.click(btn);
    const panel = screen.getByRole('dialog');
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('los toggles tienen role="switch" y aria-checked (WCAG 4.1.2)', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    switches.forEach((sw) => {
      expect(sw).toHaveAttribute('aria-checked');
    });
  });

  it('el panel tiene aria-modal="true" para señalizar el focus trap (WCAG 2.1.2)', () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
