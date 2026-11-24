import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useFormValidation } from './useFormValidation';
import { useAuth } from '../../app/AuthContext';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import { CATALOG_KIND_LABELS, catalogKindForUser, needsLabel, needsForUser } from '../../services/identity';
import { DEMO_PASSWORD } from '../../services/password';
import { DEFAULT_PREFERENCES } from '../../types/accessibility';
import type { User } from '../../types/user';
import logo from '../../assets/logo.png';

interface LoginValues {
  email: string;
  password: string;
}

const INITIAL: LoginValues = { email: '', password: '' };

function validate(values: LoginValues): Partial<Record<keyof LoginValues, string>> {
  const errors: Partial<Record<keyof LoginValues, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Escribe un correo válido.';
  if (!values.password) errors.password = 'Escribe tu contraseña.';
  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const { announce } = useAccessibility();
  const { authenticate } = useUserRegistry();
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const credentials = (state ?? {}) as Partial<LoginValues>;

  const { values, handleChange, handleBlur, handleSubmit, visibleError } =
    useFormValidation<LoginValues>(
      { email: credentials.email ?? INITIAL.email, password: credentials.password ?? INITIAL.password },
      validate
    );

  const handleLogin = handleSubmit(async (formValues) => {
    setLoginError('');
    setBusy(true);
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
      if (adminEmail && adminPassword
        && formValues.email.trim().toLocaleLowerCase('es') === adminEmail.toLocaleLowerCase('es')
        && formValues.password === adminPassword) {
        const admin: User = {
          id: 'admin', name: 'Administrador', email: adminEmail, role: 'admin',
          disabilities: ['no_indica'], disabilityConsent: false,
          accessibilityPreferences: DEFAULT_PREFERENCES,
          registeredAt: new Date().toISOString(),
        };
        login(admin);
        announce('Acceso de administrador correcto.');
        navigate('/admin');
        return;
      }

      const user = await authenticate(formValues.email, formValues.password);
      if (!user) {
        const message = 'Correo o contraseña incorrectos. Revisa los datos e inténtalo otra vez.';
        setLoginError(message);
        announce(message);
        return;
      }
      const kind = catalogKindForUser(user);
      const needs = needsForUser(user);
      login(user);
      announce(`Inicio de sesión correcto. Necesidades: ${needsLabel(needs)}. Catálogo asignado: ${CATALOG_KIND_LABELS[kind]}.`);
      navigate(`/catalog/${kind}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      setLoginError(message);
      announce(message);
    } finally {
      setBusy(false);
    }
  });

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page" tabIndex={-1}>
        <div className="login-hero">
          <img src={logo} alt="CompraFácil Inclusiva: carrito de compras con personas diversas" />
          <h1>Iniciar sesión</h1>
          <p className="muted">Entrarás directamente al catálogo adaptado a tus necesidades.</p>
        </div>
        <form noValidate onSubmit={handleLogin} aria-label="Formulario de inicio de sesión" className="card stack">
          <FormField label="Correo electrónico" type="email" autoComplete="email" required
            value={values.email} error={visibleError('email')}
            onChange={(event) => handleChange('email', event.target.value)}
            onBlur={() => handleBlur('email')} />
          <FormField label="Contraseña" type="password" autoComplete="current-password" required
            hint="Sin CAPTCHA. Puedes usar el gestor de contraseñas." value={values.password}
            error={visibleError('password')}
            onChange={(event) => handleChange('password', event.target.value)}
            onBlur={() => handleBlur('password')} />
          {loginError && (
            <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {loginError}</p>
          )}
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Identificando tu perfil…' : 'Entrar a mi catálogo'}
            </button>
            <Link to="/register" className="btn btn-secondary">Crear cuenta</Link>
          </div>
        </form>
        <aside className="demo-box" aria-labelledby="demo-title">
          <h2 id="demo-title">Cuentas de demostración</h2>
          <p>Prueba cada catálogo con la contraseña <strong>{DEMO_PASSWORD}</strong>:</p>
          <ul>
            <li>maria@ejemplo.com · catálogo visual</li>
            <li>carlos@ejemplo.com · catálogo auditivo</li>
            <li>ana@ejemplo.com · catálogo motriz</li>
            <li>pedro@ejemplo.com · catálogo cognitivo</li>
            <li>elena@ejemplo.com · catálogo combinado</li>
            <li>laura@ejemplo.com · catálogo general</li>
          </ul>
          <p className="muted">Los pagos y el asistente funcionan en modo demostración; no se procesan pagos reales.</p>
        </aside>
      </main>
    </>
  );
}
