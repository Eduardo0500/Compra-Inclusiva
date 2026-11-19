/**
 * Hook ligero de validación de formulario.
 * Devuelve errors, touched y helpers sin dependencias externas.
 */
import { useState, useCallback } from 'react';

type Errors<T> = Partial<Record<keyof T, string>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validate: (values: T) => Errors<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

  const handleSubmit = useCallback(
    (onValid: (values: T) => void) =>
      (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(values);
        // Marcar todos como tocados al intentar enviar
        const allTouched = Object.keys(values).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {} as Record<keyof T, boolean>
        );
        setTouched(allTouched);
        setErrors(errs);
        if (Object.keys(errs).length === 0) {
          onValid(values);
        }
      },
    [values, validate]
  );

  // Error visible solo si el campo fue tocado
  const visibleError = useCallback(
    (field: keyof T): string | undefined =>
      touched[field] ? errors[field] : undefined,
    [touched, errors]
  );

  return { values, handleChange, handleBlur, handleSubmit, visibleError };
}
