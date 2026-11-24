import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import {
  CATALOG_KIND_LABELS,
  DISABILITY_OPTIONS,
  TOOL_LABELS,
  applyRecommendations,
  catalogKindForNeeds,
  disabilityLabel,
  needsForUser,
  recommendedToolsForNeeds,
} from '../../services/identity';
import type { DisabilityType, User } from '../../types/user';

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  disabilities: DisabilityType[];
  disabilityConsent: boolean;
}

const INITIAL: RegisterValues = {
  name: '', email: '', password: '', confirmPassword: '', disabilities: [], disabilityConsent: false,
};

type Errors = Partial<Record<keyof RegisterValues, string>>;

function validateData(values: RegisterValues): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = 'Escribe tu nombre completo (al menos 2 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (values.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
  return errors;
}

function validateNeeds(values: RegisterValues): Errors {
  const errors: Errors = {};
  const needs = needsForUser({ disabilities: values.disabilities, disabilityConsent: true, disability: null });
  if (needs.length && !values.disabilityConsent) {
    errors.disabilityConsent = 'Necesitamos tu consentimiento para guardar esta información y personalizar tu experiencia.';
  }
  return errors;
}

const hasRealNeeds = (values: DisabilityType[]): boolean =>
  values.some((item) => ['visual', 'auditiva', 'motriz', 'cognitiva'].includes(item));

export function RegisterPage() {
  const navigate = useNavigate();
  const { prefs } = useAccessibility();
  const { registerUser } = useUserRegistry();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [values, setValues] = useState<RegisterValues>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [registerError, setRegisterError] = useState('');
  const [saving, setSaving] = useState(false);

  const needs = useMemo(
    () => needsForUser({ disabilities: values.disabilities, disabilityConsent: true, disability: null }),
    [values.disabilities]
  );
  const tools = recommendedToolsForNeeds(needs);
  const catalogKind = catalogKindForNeeds(needs);

  const change = <K extends keyof RegisterValues>(key: K, value: RegisterValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const goToNeeds = (event: FormEvent) => {
    event.preventDefault();
    const found = validateData(values);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setStep(2);
      document.getElementById('main-content')?.focus();
    }
  };

  const goToSummary = (event: FormEvent) => {
    event.preventDefault();
    const found = validateNeeds(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const declared = hasRealNeeds(values.disabilities) && !values.disabilityConsent
      ? values.disabilities.filter((item) => item === 'ninguna' || item === 'no_indica')
      : values.disabilities;
    change('disabilities', declared);
    setStep(3);
    document.getElementById('main-content')?.focus();
  };

  const confirm = async () => {
    setSaving(true);
    setRegisterError('');
    const user: User = {
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: values.name.trim(),
      email: values.email.trim(),
      role: 'user',
      disabilities: values.disabilities,
      disability: values.disabilities[0] ?? null,
      disabilityConsent: values.disabilityConsent || !hasRealNeeds(values.disabilities),
      accessibilityPreferences: applyRecommendations(prefs, values.disabilities),
      registeredAt: new Date().toISOString(),
    };
    try {
      await registerUser(user, values.password);
      navigate('/register/confirmation', {
        state: { name: user.name, email: user.email, password: values.password, catalogKind },
        replace: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      setRegisterError(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDisability = (value: DisabilityType, checked: boolean) => {
    const exclusive = value === 'ninguna' || value === 'no_indica';
    const next = checked
      ? exclusive
        ? [value]
        : [...values.disabilities.filter((item) => item !== 'ninguna' && item !== 'no_indica'), value]
      : values.disabilities.filter((item) => item !== value);
    change('disabilities', next);
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page" tabIndex={-1}>
        <p className="step-indicator" aria-live="polite">Paso {step} de 3 · Crear cuenta</p>
        <ol className="step-list" aria-label="Progreso del registro">
          <li aria-current={step === 1 ? 'step' : undefined} className={step >= 1 ? 'done' : ''}>Tus datos</li>
          <li aria-current={step === 2 ? 'step' : undefined} className={step >= 2 ? 'done' : ''}>Necesidades</li>
          <li aria-current={step === 3 ? 'step' : undefined} className={step >= 3 ? 'done' : ''}>Confirmación</li>
        </ol>

        {step === 1 && (
          <form noValidate onSubmit={goToNeeds} aria-label="Datos de la cuenta" className="card stack">
            <h1>Crea tu cuenta</h1>
            <p className="muted">Necesitamos estos datos paraguardar tu carrito, tus pedidos y tus preferencias.</p>
            <FormField label="Nombre completo" type="text" autoComplete="name" required
              value={values.name} error={errors.name} onChange={(event) => change('name', event.target.value)} />
            <FormField label="Correo electrónico" type="email" autoComplete="email" required
              hint="Ejemplo: usuario@correo.com" value={values.email} error={errors.email}
              onChange={(event) => change('email', event.target.value)} />
            <FormField label="Contraseña" type="password" autoComplete="new-password" required
              hint="Mínimo 8 caracteres. No la compartas." value={values.password} error={errors.password}
              onChange={(event) => change('password', event.target.value)} />
            <FormField label="Confirmar contraseña" type="password" autoComplete="new-password" required
              value={values.confirmPassword} error={errors.confirmPassword}
              onChange={(event) => change('confirmPassword', event.target.value)} />
            <div className="actions">
              <button className="btn btn-primary" type="submit">Continuar a necesidades</button>
              <Link className="btn btn-ghost" to="/login">Ya tengo cuenta</Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form noValidate onSubmit={goToSummary} aria-label="Personaliza tu experiencia de compra" className="card stack">
            <h1>Personaliza tu experiencia de compra</h1>
            <p className="muted">
              Esta información es opcional. Puedes elegir varias opciones y cambiarlas después en Mi perfil.
            </p>
            <fieldset className="choice-group">
              <legend>¿Qué necesidades de accesibilidad tienes?</legend>
              {DISABILITY_OPTIONS.map((option) => (
                <label className="choice" key={option.value}>
                  <input type="checkbox" checked={values.disabilities.includes(option.value)}
                    onChange={(event) => toggleDisability(option.value, event.target.checked)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>

            {hasRealNeeds(values.disabilities) && (
              <div className="consent-box">
                <input id="register-consent" type="checkbox" checked={values.disabilityConsent}
                  aria-describedby={errors.disabilityConsent ? 'register-consent-error' : 'register-consent-hint'}
                  aria-invalid={errors.disabilityConsent ? true : undefined}
                  onChange={(event) => change('disabilityConsent', event.target.checked)} />
                <div>
                  <label htmlFor="register-consent">
                    Autorizo el tratamiento de mis datos de discapacidad para adaptar la interfaz.
                  </label>
                  <p id="register-consent-hint" className="muted">
                    Solo se usan para personalizar tu experiencia. Puedes revocar el consentimiento cuando quieras desde Mi perfil.
                  </p>
                  {errors.disabilityConsent && (
                    <p id="register-consent-error" className="error-msg" role="alert">
                      <span aria-hidden="true">⚠</span> {errors.disabilityConsent}
                    </p>
                  )}
                </div>
              </div>
            )}

            <section className="preview-box" aria-labelledby="preview-title">
              <h2 id="preview-title">Así se adaptará tu catálogo</h2>
              <p><strong>Catálogo asignado:</strong> {CATALOG_KIND_LABELS[catalogKind]}</p>
              {tools.length ? (
                <ul>
                  {tools.map((tool) => <li key={tool}>{TOOL_LABELS[tool]}</li>)}
                </ul>
              ) : (
                <p>Verás el catálogo general con accesibilidad básica.</p>
              )}
              <p className="muted">Podrás activar o quitar herramientas en cualquier momento.</p>
            </section>

            <div className="actions">
              <button className="btn btn-primary" type="submit">Continuar al resumen</button>
              <button className="btn btn-ghost" type="button" onClick={() => setStep(1)}>Volver</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <section className="card stack" aria-labelledby="summary-title">
            <h1 id="summary-title">Confirma tu registro</h1>
            <p className="muted">Revisa tus datos antes de crear la cuenta. Tu contraseña no se muestra.</p>
            <dl className="summary-list">
              <div><dt>Nombre</dt><dd>{values.name}</dd></div>
              <div><dt>Correo</dt><dd>{values.email}</dd></div>
              <div>
                <dt>Necesidades declaradas</dt>
                <dd>{values.disabilities.map(disabilityLabel).join(', ') || 'No indicadas'}</dd>
              </div>
              <div><dt>Consentimiento</dt><dd>{values.disabilityConsent ? 'Otorgado' : 'No requerido'}</dd></div>
              <div><dt>Catálogo asignado</dt><dd>{CATALOG_KIND_LABELS[catalogKind]}</dd></div>
              <div>
                <dt>Herramientas recomendadas</dt>
                <dd>{tools.length ? tools.map((tool) => TOOL_LABELS[tool]).join(', ') : 'Accesibilidad básica'}</dd>
              </div>
            </dl>
            {registerError && (
              <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {registerError}</p>
            )}
            <div className="actions">
              <button className="btn btn-primary" onClick={confirm} disabled={saving}>
                {saving ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Volver y editar</button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

interface ConfirmationState {
  name?: string;
  email?: string;
  password?: string;
}

export function RegistrationConfirmationPage() {
  const { state } = useLocation();
  const credentials = (state ?? {}) as ConfirmationState;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page" tabIndex={-1}>
        <div className="card stack" role="status">
          <h1>Registro completado</h1>
          <p>Tu cuenta se creó correctamente. Estas son las credenciales que debes usar para entrar:</p>
          {credentials.email ? (
            <dl className="summary-list">
              <div><dt>Nombre</dt><dd>{credentials.name || 'Tu cuenta'}</dd></div>
              <div><dt>Correo electrónico</dt><dd>{credentials.email}</dd></div>
              <div>
                <dt>Contraseña</dt>
                <dd>
                  <input
                    aria-label="Contraseña creada"
                    readOnly
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password ?? ''}
                  />
                </dd>
              </div>
            </dl>
          ) : (
            <p className="muted">Vuelve a iniciar sesión con el correo y la contraseña que elegiste.</p>
          )}
          <p className="muted">Guarda estos datos. Tu contraseña no se muestra en tu perfil.</p>
          <div className="actions">
            {credentials.password && (
              <button className="btn btn-ghost" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            )}
            <Link className="btn btn-primary" to="/login" state={credentials}>
              Ir a iniciar sesión
            </Link>
          </div>
          <p className="muted">Tus preferencias y necesidades quedarán cargadas automáticamente.</p>
        </div>
      </main>
    </>
  );
}
