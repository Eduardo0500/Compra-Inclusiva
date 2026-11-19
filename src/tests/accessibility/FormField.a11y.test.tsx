/**
 * Tests de accesibilidad para FormField.
 * Verifica WCAG 1.3.1, 3.3.1, 3.3.2, 4.1.2.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from '../../shared/FormField';

describe('FormField', () => {
  it('la etiqueta está vinculada al input (WCAG 1.3.1, 3.3.2)', () => {
    render(<FormField label="Correo" type="email" />);
    const input = screen.getByLabelText('Correo');
    expect(input).toBeInTheDocument();
  });

  it('muestra el error con role="alert" y aria-invalid (WCAG 3.3.1, 4.1.2)', () => {
    render(<FormField label="Correo" type="email" error="Correo inválido" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido');
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
  });

  it('aria-describedby apunta al hint cuando existe (WCAG 3.3.2)', () => {
    render(<FormField label="Correo" type="email" hint="Ejemplo: a@b.com" />);
    const input = screen.getByLabelText('Correo');
    const hintId = input.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    const hint = document.getElementById(hintId!);
    expect(hint).toHaveTextContent('Ejemplo: a@b.com');
  });

  it('aria-required está presente en campos obligatorios (WCAG 4.1.2)', () => {
    render(<FormField label="Nombre" type="text" required />);
    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('aria-required', 'true');
  });
});
