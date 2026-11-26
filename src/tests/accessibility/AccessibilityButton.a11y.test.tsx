/**
 * Tests de accesibilidad para el botón flotante y su panel (menú por categorías).
 * WCAG: 2.1.1 (Esc cierra), 2.4.3 (foco), 4.1.2 (roles ARIA), 2.1.2 (focus trap).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccessibilityButton } from '../../features/accessibility/AccessibilityButton';
import { AccessibilityProvider } from '../../app/AccessibilityContext';
import { safeStorage, STORAGE_KEYS } from '../../services/storage';

function renderBtn() {
  let region = document.getElementById('live-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'live-region';
    document.body.appendChild(region);
  }
  return render(
    <AccessibilityProvider>
      <AccessibilityButton />
    </AccessibilityProvider>
  );
}

describe('AccessibilityButton', () => {
  it('el botón tiene aria-label y aria-expanded=false por defecto', () => {
    renderBtn();
    const btn = screen.getByRole('button', { name: /opciones de accesibilidad/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre el panel al hacer clic y lo anuncia como dialog', () => {
    renderBtn();
    const btn = screen.getByRole('button', { name: /opciones de accesibilidad/i });
    fireEvent.click(btn);
    expect(screen.getByRole('dialog', { name: /menú de accesibilidad/i })).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('cierra el panel con Escape (WCAG 2.1.1)', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    const panel = screen.getByRole('dialog');
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('los toggles tienen role="switch" y aria-checked (WCAG 4.1.2)', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    // Expandir la primera categoría para que haya switches visibles
    const catBtns = screen.getAllByRole('button', { expanded: false });
    if (catBtns.length > 0) fireEvent.click(catBtns[0]);
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    switches.forEach(sw => expect(sw).toHaveAttribute('aria-checked'));
  });

  it('el panel tiene aria-modal="true" para señalizar el focus trap (WCAG 2.1.2)', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('abre el panel con el atajo Alt+A', () => {
    renderBtn();
    fireEvent.keyDown(window, { key: 'a', altKey: true });
    expect(screen.getByRole('dialog', { name: /menú de accesibilidad/i })).toBeInTheDocument();
  });

  it('filtra las herramientas desde el buscador', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    fireEvent.change(screen.getByLabelText(/buscar herramienta/i), { target: { value: 'contraste' } });
    // Con la búsqueda activa los toggles de las categorías se muestran en abierto
    expect(screen.getByRole('switch', { name: /alto contraste/i })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /botones grandes/i })).toBeNull();
  });

  it('las categorías son plegables con aria-expanded (patrón disclosure)', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button', { name: /opciones de accesibilidad/i }));
    // Debe haber botones con aria-expanded en el panel
    const disclosureBtns = screen.getAllByRole('button').filter(
      b => b.hasAttribute('aria-controls') && b !== screen.getByRole('button', { name: /opciones de accesibilidad/i })
        && b !== screen.getByRole('button', { name: /cerrar/i })
    );
    expect(disclosureBtns.length).toBeGreaterThan(0);
  });

  it('mueve el panel flotante con el teclado y guarda su posición', () => {
    safeStorage.remove(STORAGE_KEYS.a11yPosition);
    renderBtn();
    const fab = screen.getByRole('button', { name: /opciones de accesibilidad/i });
    const initialLeft = fab.style.left;
    // Abrir el panel para acceder al botón mover
    fireEvent.click(fab);
    const moveBtn = screen.getByRole('button', { name: /mover panel de accesibilidad/i });
    fireEvent.keyDown(moveBtn, { key: 'ArrowLeft' });
    expect(fab.style.left).not.toBe(initialLeft);
    expect(safeStorage.get<{ x: number; y: number } | null>(STORAGE_KEYS.a11yPosition, null)).not.toBeNull();
    safeStorage.remove(STORAGE_KEYS.a11yPosition);
  });
});
