/**
 * LoginPage – inicio de sesión accesible.
 * WCAG 3.3.8: sin CAPTCHA cognitivo, autocomplete obligatorio.
 * WCAG 2.2.1: la sesión no expira sin aviso.
 * Al hacer login las preferencias guardadas se aplican solas (AuthContext).
 *
 * Credenciales de administrador (hardcodeadas, solo para demo):
 *   Usuario: admin@compral.com
 *   Contraseña: Admin2024!
 */
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useFormValidation } from './useFormValidation';
import { useAuth } from '../../app/AuthContext';
import { useAccessibility } from '../../app/AccessibilityContext';
import { DEFAULT_PREFERENCES } from '../../types/accessibility';
import type { User } from '../../types/user';
import logo from '../../assets/logo.png';

// ─── Credenciales del administrador (demo / hardcodeadas) ───────────────────
const ADMIN_EMAIL    = 'admin@compral.com';
const ADMIN_PASSWORD = 'Admin2024!';
// ────────────────────────────────────────────────────────────────────────────

interface LoginValues {
  email: string;
  password: string;
}

const INITIAL: LoginValues = { email: '', password: '' };

function validate(v: LoginValues): Partial<Record<keyof LoginValues, string>> {
  const errs: Partial<Record<keyof LoginValues, string>> = {};
  if (!v.email.includes('@')) errs.email = 'Introduce un correo electrónico válido.';
  if (!v.password) errs.password = 'La contraseña no puede estar vacía.';
  return errs;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { announce } = useAccessibility();

  const { values, handleChange, handleBlur, handleSubmit, visibleError } =
    useFormValidation<LoginValues>(INITIAL, validate);

  const handleLogin = handleSubmit((v) => {
    // ── Acceso de administrador ──────────────────────────────────────────────
    if (v.email === ADMIN_EMAIL && v.password === ADMIN_PASSWORD) {
      const adminUser: User = {
        id: 'admin',
        name: 'Administrador',
        email: ADMIN_EMAIL,
        role: 'admin',
        disability: null,
        disabilityConsent: false,
        accessibilityPreferences: DEFAULT_PREFERENCES,
        registeredAt: new Date().toISOString(),
      };
      login(adminUser);
      announce('Acceso de administrador correcto. Bienvenido.');
      navigate('/admin');
      return;
    }

    // ── Acceso de usuario normal (simulación) ────────────────────────────────
    const savedPrefs = (() => {
      try {
        const raw = localStorage.getItem('a11y-prefs');
        return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
      } catch {
        return DEFAULT_PREFERENCES;
      }
    })();

    const user: User = {
      id: 'demo-user',
      name: v.email.split('@')[0],
      email: v.email,
      role: 'user',
      disability: null,
      disabilityConsent: false,
      accessibilityPreferences: savedPrefs,
      registeredAt: new Date().toISOString(),
    };
    login(user);
    announce('Inicio de sesión correcto. Bienvenido, ' + user.name);
    navigate('/profile/accessibility');
  });

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page">

        {/* Logo del proyecto (WCAG 1.1.1: texto alternativo descriptivo) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img
            src={logo}
            alt="CompraFácil Inclusiva – carrito de compras con personas con discapacidad, adulto mayor y niño"
            style={{ width: 160, height: 160, objectFit: 'contain' }}
          />
        </div>

        <h1 style={{ textAlign: 'center' }}>Iniciar sesión</h1>
        <p style={{ marginTop: '0.25rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Los campos marcados con <span aria-hidden="true">*</span>
          <span className="sr-only">asterisco</span> son obligatorios.
        </p>

        <form
          noValidate
          onSubmit={handleLogin}
          aria-label="Formulario de inicio de sesión"
          className="card"
        >
          <FormField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            error={visibleError('email')}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
          />

          <FormField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={values.password}
            error={visibleError('password')}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              Entrar
            </button>
            <Link to="/register" className="btn btn-ghost">
              Crear cuenta nueva
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
