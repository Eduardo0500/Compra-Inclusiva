/**
 * RegisterPage – formulario de registro con perfil de accesibilidad.
 * Criterios F4 aplicados: 1.3.1, 1.3.5, 2.1.1, 3.3.1, 3.3.2, 3.3.3, 3.3.7, 3.3.8, 4.1.2.
 * Discapacidad: campo opcional, requiere consentimiento explícito (LOPD / GDPR).
 */
import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useFormValidation } from './useFormValidation';
import { useAuth } from '../../app/AuthContext';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import type { DisabilityType, User } from '../../types/user';

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  disability: DisabilityType | '';
  disabilityConsent: boolean;
}

const INITIAL: RegisterValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  disability: '',
  disabilityConsent: false,
};

function validate(v: RegisterValues): Partial<Record<keyof RegisterValues, string>> {
  const errs: Partial<Record<keyof RegisterValues, string>> = {};
  if (!v.name.trim()) errs.name = 'El nombre es obligatorio.';
  if (!v.email.includes('@')) errs.email = 'Introduce un correo electrónico válido (ejemplo: usuario@correo.com).';
  if (v.password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres.';
  if (v.password !== v.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden.';
  if (v.disability && !v.disabilityConsent) {
    errs.disabilityConsent =
      'Para guardar la información de discapacidad debes dar tu consentimiento.';
  }
  return errs;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { prefs, announce } = useAccessibility();
  const { addUser } = useUserRegistry();
  const [showSummary, setShowSummary] = useState(false);
  const [pendingValues, setPendingValues] = useState<RegisterValues | null>(null);

  const { values, handleChange, handleBlur, handleSubmit, visibleError } =
    useFormValidation<RegisterValues>(INITIAL, validate);

  // Paso 1: mostrar resumen antes de confirmar (WCAG 3.3.4)
  const handleFirstSubmit = handleSubmit((v) => {
    setPendingValues(v);
    setShowSummary(true);
    announce('Revisa el resumen de tu registro antes de confirmar.');
  });

  // Paso 2: confirmar definitivamente
  const handleConfirm = useCallback(() => {
    if (!pendingValues) return;
    const user: User = {
      id: crypto.randomUUID(),
      name: pendingValues.name,
      email: pendingValues.email,
      role: 'user',
      disability: (pendingValues.disability as DisabilityType) || null,
      disabilityConsent: pendingValues.disabilityConsent,
      // Las preferencias guardadas son las actuales del menú (WCAG 3.3.7)
      accessibilityPreferences: prefs,
      registeredAt: new Date().toISOString(),
    };
    addUser(user);
    login(user);
    announce('Registro completado. Bienvenido, ' + user.name);
    navigate('/profile/accessibility');
  }, [pendingValues, prefs, addUser, login, announce, navigate]);

  if (showSummary && pendingValues) {
    return (
      <>
        <SkipLink />
        <main id="main-content" className="page">
          <div className="card">
            <h1>Confirma tu registro</h1>
            <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              Revisa tus datos antes de crear la cuenta:
            </p>
            <dl style={{ display: 'grid', gap: '0.5rem' }}>
              <SummaryRow label="Nombre" value={pendingValues.name} />
              <SummaryRow label="Correo" value={pendingValues.email} />
              <SummaryRow
                label="Discapacidad declarada"
                value={pendingValues.disability || 'No declarada'}
              />
            </dl>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Confirmar y crear cuenta
              </button>
              <button className="btn btn-ghost" onClick={() => setShowSummary(false)}>
                Volver y editar
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page">
        <h1>Crear cuenta</h1>
        <p style={{ marginTop: '0.25rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          Los campos marcados con <span aria-hidden="true">*</span>
          <span className="sr-only">asterisco</span> son obligatorios.
        </p>

        {/* Sin CAPTCHA (F4) – autenticación accesible WCAG 3.3.8 */}
        <form
          noValidate
          onSubmit={handleFirstSubmit}
          aria-label="Formulario de registro"
          className="card"
        >
          <FormField
            label="Nombre completo"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            error={visibleError('name')}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
          />

          <FormField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            error={visibleError('email')}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            hint="Ejemplo: usuario@correo.com"
          />

          <FormField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={values.password}
            error={visibleError('password')}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            hint="Mínimo 8 caracteres"
          />

          <FormField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={values.confirmPassword}
            error={visibleError('confirmPassword')}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
          />

          {/* Información de discapacidad – opcional, con consentimiento */}
          <FormField
            as="select"
            label="Tipo de discapacidad (opcional)"
            value={values.disability}
            error={visibleError('disability')}
            onChange={(e) =>
              handleChange('disability', e.target.value as DisabilityType | '')
            }
            hint="Esta información personaliza tu experiencia de accesibilidad. Es completamente opcional."
          >
            <option value="">Prefiero no indicarlo</option>
            <option value="visual">Visual</option>
            <option value="auditiva">Auditiva</option>
            <option value="motriz">Motriz</option>
            <option value="cognitiva">Cognitiva</option>
          </FormField>

          {/* Consentimiento: solo visible si se seleccionó discapacidad */}
          {values.disability && (
            <div className="field">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <input
                  id="disability-consent"
                  type="checkbox"
                  style={{ marginTop: '0.2rem', minWidth: '24px', minHeight: '24px' }}
                  checked={values.disabilityConsent}
                  aria-required="true"
                  aria-describedby={visibleError('disabilityConsent') ? 'consent-error' : undefined}
                  aria-invalid={visibleError('disabilityConsent') ? 'true' : undefined}
                  onChange={(e) => handleChange('disabilityConsent', e.target.checked)}
                />
                <label htmlFor="disability-consent" style={{ cursor: 'pointer' }}>
                  Acepto que CompraFácil Inclusiva guarde mi información de discapacidad para
                  personalizar mi experiencia de accesibilidad. Puedo eliminarla en cualquier momento
                  desde mi perfil.
                </label>
              </div>
              {visibleError('disabilityConsent') && (
                <span id="consent-error" className="error-msg" role="alert">
                  <span aria-hidden="true">⚠</span>
                  {visibleError('disabilityConsent')}
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              Continuar
            </button>
            <Link to="/login" className="btn btn-ghost">
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={{ fontWeight: 700 }}>{label}</dt>
      <dd style={{ marginLeft: '1rem', marginBottom: '0.25rem' }}>{value}</dd>
    </>
  );
}
