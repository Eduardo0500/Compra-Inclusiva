/**
 * FormField – campo de formulario accesible reutilizable.
 * Aplica por defecto todos los criterios F4 "todos los formularios":
 *   - Etiqueta visible vinculada (WCAG 1.3.1, 3.3.2)
 *   - aria-required, aria-invalid, aria-describedby (WCAG 4.1.2)
 *   - Error en texto con icono (WCAG 1.4.1, 3.3.1, 3.3.3)
 *   - Hint/instrucción visible (WCAG 3.3.2)
 *   - autocomplete (WCAG 1.3.5)
 */
import { useId, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

interface InputProps extends BaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  as?: 'input';
}

interface SelectProps extends BaseProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  as: 'select';
  children: React.ReactNode;
}

type FormFieldProps = InputProps | SelectProps;

export function FormField(props: FormFieldProps) {
  const uid = useId();
  const { label, error, hint, required, as = 'input', ...rest } = props;
  const errorId = `${uid}-error`;
  const hintId = `${uid}-hint`;

  const describedBy = [hint ? hintId : '', error ? errorId : '']
    .filter(Boolean)
    .join(' ') || undefined;

  const sharedProps = {
    id: uid,
    'aria-required': required,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': describedBy,
  };

  return (
    <div className="field">
      <label htmlFor={uid}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--color-error)', marginLeft: '0.25rem' }}>
            *
          </span>
        )}
      </label>

      {hint && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}

      {as === 'select' ? (
        <select {...sharedProps} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as SelectProps).children}
        </select>
      ) : (
        <input {...sharedProps} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}

      {error && (
        <span id={errorId} className="error-msg" role="alert">
          {/* Icono ≠ solo color (WCAG 1.4.1) */}
          <span aria-hidden="true">⚠</span>
          {error}
        </span>
      )}
    </div>
  );
}
