import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import {
  CATALOG_KIND_LABELS, DISABILITY_OPTIONS, LEVEL_ANSWERS, LEVEL_LABELS,
  LEVEL_QUESTIONS, TOOL_LABELS,
  applyRecommendations, calcularNivel, catalogKindForNeeds,
  disabilityLabel, needsForUser, recommendedToolsForNeeds,
  type DisabilityNeedKey,
} from '../../services/identity';
import type { DisabilityLevelData, DisabilityType, User } from '../../types/user';

interface RegisterValues {
  name:              string;
  email:             string;
  password:          string;
  confirmPassword:   string;
  disabilities:      DisabilityType[];
  disabilityConsent: boolean;
}

const INITIAL: RegisterValues = {
  name: '', email: '', password: '', confirmPassword: '', disabilities: [], disabilityConsent: false,
};

type Errors = Partial<Record<keyof RegisterValues, string>>;

function validateData(v: RegisterValues): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2)                                     e.name = 'Escribe tu nombre completo (al menos 2 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))          e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (v.password.length < 8)                                        e.password = 'La contraseña debe tener al menos 8 caracteres.';
  if (v.password !== v.confirmPassword)                             e.confirmPassword = 'Las contraseñas no coinciden.';
  return e;
}

function validateNeeds(v: RegisterValues): Errors {
  const e: Errors = {};
  const needs = needsForUser({ disabilities: v.disabilities, disabilityConsent: true, disability: null });
  if (needs.length && !v.disabilityConsent) {
    e.disabilityConsent = 'Necesitamos tu consentimiento para guardar esta información y personalizar tu experiencia.';
  }
  return e;
}

const hasRealNeeds = (d: DisabilityType[]) =>
  d.some(item => ['visual', 'auditiva', 'motriz', 'cognitiva'].includes(item));

const REAL_NEEDS = ['visual', 'auditiva', 'motriz', 'cognitiva'] as const;

/** Cuestionario: una pregunta por vez por necesidad */
function LevelQuestionnaire({
  needKey,
  answers,
  onChange,
  onFinish,
  onBack,
  onSkip,
}: {
  needKey:  DisabilityNeedKey;
  answers:  number[];
  onChange: (idx: number, val: number) => void;
  onFinish: () => void;
  onBack:   () => void;   // ← volver a paso anterior (necesidades o nivel anterior)
  onSkip:   () => void;
}) {
  const questions = LEVEL_QUESTIONS[needKey];
  const [currentQ, setCurrentQ] = useState(0);
  const question = questions[currentQ];
  const [error, setError] = useState('');

  const goNext = () => {
    if (answers[currentQ] === undefined) {
      setError('Selecciona una opción antes de continuar.');
      return;
    }
    setError('');
    if (currentQ < questions.length - 1) setCurrentQ(q => q + 1);
    else onFinish();
  };

  const goBack = () => {
    setError('');
    if (currentQ > 0) {
      setCurrentQ(q => q - 1);
    } else {
      // Primera pregunta → volver al paso anterior del registro
      onBack();
    }
  };

  return (
    <div className="card stack">
      <p className="step-indicator" aria-live="polite">
        Pregunta {currentQ + 1} de {questions.length}
      </p>
      <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
        Esta información es un autoreporte para adaptar la tienda.{' '}
        <strong>No es un diagnóstico médico.</strong>
      </p>
      <fieldset className="choice-group" style={{ border: 'none', padding: 0 }}>
        <legend style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>
          {question.text}
        </legend>
        {LEVEL_ANSWERS.map(opt => (
          <label key={opt.value} className="choice">
            <input
              type="radio"
              name={`q-${needKey}-${currentQ}`}
              value={opt.value}
              checked={answers[currentQ] === opt.value}
              onChange={() => { onChange(currentQ, opt.value); setError(''); }}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </fieldset>
      {error && <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {error}</p>}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={goBack}>
          Volver
        </button>
        <button type="button" className="btn btn-primary" onClick={goNext}>
          {currentQ < questions.length - 1 ? 'Siguiente' : 'Terminar'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSkip}
          style={{ marginLeft: 'auto' }}>
          Omitir cuestionario
        </button>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate    = useNavigate();
  const { prefs }   = useAccessibility();
  const { registerUser } = useUserRegistry();

  /* steps: 1=datos, 2=necesidades, 3=cuestionario, 4=confirmación */
  const [step, setStep]       = useState<1 | 2 | 3 | 4>(1);
  const [values, setValues]   = useState<RegisterValues>(INITIAL);
  const [errors, setErrors]   = useState<Errors>({});
  const [regError, setRegErr] = useState('');
  const [saving, setSaving]   = useState(false);

  /* cuestionario */
  const realNeeds = useMemo(
    () => values.disabilities.filter(d => REAL_NEEDS.includes(d as DisabilityNeedKey)) as DisabilityNeedKey[],
    [values.disabilities],
  );
  const [levelIdx, setLevelIdx] = useState(0);  // índice dentro de realNeeds
  const [levelAnswers, setLevelAnswers] = useState<Partial<Record<DisabilityNeedKey, number[]>>>({});

  const currentNeedKey = realNeeds[levelIdx] as DisabilityNeedKey | undefined;

  const needs      = useMemo(() => needsForUser({ disabilities: values.disabilities, disabilityConsent: true, disability: null }), [values.disabilities]);
  const tools      = recommendedToolsForNeeds(needs);
  const catalogKind = catalogKindForNeeds(needs);

  const change = <K extends keyof RegisterValues>(key: K, val: RegisterValues[K]) => {
    setValues(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: undefined }));
  };

  /* ── pasos del formulario ── */
  const goToNeeds = (e: FormEvent) => {
    e.preventDefault();
    const found = validateData(values);
    setErrors(found);
    if (!Object.keys(found).length) { setStep(2); document.getElementById('main-content')?.focus(); }
  };

  const goToQuestionnaire = (e: FormEvent) => {
    e.preventDefault();
    const found = validateNeeds(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    // Si hay necesidades reales y consentimiento → ir al cuestionario
    if (hasRealNeeds(values.disabilities) && values.disabilityConsent && realNeeds.length > 0) {
      setStep(3);
    } else {
      setStep(4);
    }
    document.getElementById('main-content')?.focus();
  };

  const handleLevelAnswer = (needKey: DisabilityNeedKey, idx: number, val: number) => {
    setLevelAnswers(prev => {
      const cur = prev[needKey] ?? [];
      const next = [...cur];
      next[idx] = val;
      return { ...prev, [needKey]: next };
    });
  };

  const finishNeed = () => {
    if (levelIdx < realNeeds.length - 1) {
      setLevelIdx(i => i + 1);
    } else {
      setStep(4);
      document.getElementById('main-content')?.focus();
    }
  };

  const skipQuestionnaire = () => {
    setLevelAnswers({});
    setStep(4);
    document.getElementById('main-content')?.focus();
  };

  /** Volver desde el cuestionario: si es el primer tipo va a necesidades, si no al tipo anterior */
  const handleBackInQuestionnaire = () => {
    if (levelIdx > 0) {
      setLevelIdx(i => i - 1);
    } else {
      setStep(2);
      document.getElementById('main-content')?.focus();
    }
  };

  /* calcula niveles */
  const computedLevels = useMemo((): Partial<Record<DisabilityNeedKey, DisabilityLevelData>> => {
    const result: Partial<Record<DisabilityNeedKey, DisabilityLevelData>> = {};
    realNeeds.forEach(nk => {
      const ans = levelAnswers[nk];
      if (ans && ans.length === LEVEL_QUESTIONS[nk].length) {
        result[nk] = calcularNivel(ans);
      }
    });
    return result;
  }, [levelAnswers, realNeeds]);

  const confirm = async () => {
    setSaving(true);
    setRegErr('');
    const user: User = {
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name:              values.name.trim(),
      email:             values.email.trim(),
      role:              'user',
      disabilities:      values.disabilities,
      disability:        values.disabilities[0] ?? null,
      disabilityConsent: values.disabilityConsent || !hasRealNeeds(values.disabilities),
      accessibilityPreferences: applyRecommendations(prefs, values.disabilities),
      registeredAt:      new Date().toISOString(),
      disabilityLevels:  Object.keys(computedLevels).length ? computedLevels : undefined,
    };
    try {
      await registerUser(user, values.password);
      navigate('/register/confirmation', {
        state: { name: user.name, email: user.email, password: values.password, catalogKind },
        replace: true,
      });
    } catch (err) {
      setRegErr(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDisability = (val: DisabilityType, checked: boolean) => {
    const excl = val === 'ninguna' || val === 'no_indica';
    const next = checked
      ? excl ? [val] : [...values.disabilities.filter(d => d !== 'ninguna' && d !== 'no_indica'), val]
      : values.disabilities.filter(d => d !== val);
    change('disabilities', next);
  };

  const totalSteps = hasRealNeeds(values.disabilities) && values.disabilityConsent ? 4 : 3;
  const displayStep = step === 4 ? totalSteps : step === 3 ? 3 : step;

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page" tabIndex={-1}>
        <p className="step-indicator" aria-live="polite">
          Paso {displayStep} de {totalSteps} · Crear cuenta
        </p>
        <ol className="step-list" aria-label="Progreso del registro">
          <li aria-current={step === 1 ? 'step' : undefined} className={step >= 1 ? 'done' : ''}>Tus datos</li>
          <li aria-current={step === 2 ? 'step' : undefined} className={step >= 2 ? 'done' : ''}>Necesidades</li>
          {totalSteps === 4 && (
            <li aria-current={step === 3 ? 'step' : undefined} className={step >= 3 ? 'done' : ''}>Cuestionario</li>
          )}
          <li aria-current={step === 4 ? 'step' : undefined} className={step >= 4 ? 'done' : ''}>Confirmación</li>
        </ol>

        {/* Paso 1: datos */}
        {step === 1 && (
          <form noValidate onSubmit={goToNeeds} aria-label="Datos de la cuenta" className="card stack">
            <h1>Crea tu cuenta</h1>
            <p className="muted">Necesitamos estos datos para guardar tu carrito, tus pedidos y tus preferencias.</p>
            <FormField label="Nombre completo" type="text" autoComplete="name" required
              value={values.name} error={errors.name} onChange={e => change('name', e.target.value)} />
            <FormField label="Correo electrónico" type="email" autoComplete="email" required
              hint="Ejemplo: usuario@correo.com" value={values.email} error={errors.email}
              onChange={e => change('email', e.target.value)} />
            <FormField label="Contraseña" type="password" autoComplete="new-password" required
              hint="Mínimo 8 caracteres." value={values.password} error={errors.password}
              onChange={e => change('password', e.target.value)} />
            <FormField label="Confirmar contraseña" type="password" autoComplete="new-password" required
              value={values.confirmPassword} error={errors.confirmPassword}
              onChange={e => change('confirmPassword', e.target.value)} />
            <div className="actions">
              <button className="btn btn-primary" type="submit">Continuar a necesidades</button>
              <Link className="btn btn-ghost" to="/login">Ya tengo cuenta</Link>
            </div>
          </form>
        )}

        {/* Paso 2: necesidades */}
        {step === 2 && (
          <form noValidate onSubmit={goToQuestionnaire} aria-label="Personaliza tu experiencia" className="card stack">
            <h1>Personaliza tu experiencia de compra</h1>
            <p className="muted">Esta información es opcional y puedes cambiarla después en Mi perfil.</p>
            <fieldset className="choice-group">
              <legend>¿Qué necesidades de accesibilidad tienes?</legend>
              {DISABILITY_OPTIONS.map(opt => (
                <label className="choice" key={opt.value}>
                  <input type="checkbox" checked={values.disabilities.includes(opt.value)}
                    onChange={e => toggleDisability(opt.value, e.target.checked)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </fieldset>
            {hasRealNeeds(values.disabilities) && (
              <div className="consent-box">
                <input id="register-consent" type="checkbox" checked={values.disabilityConsent}
                  aria-describedby={errors.disabilityConsent ? 'register-consent-error' : 'register-consent-hint'}
                  aria-invalid={errors.disabilityConsent ? true : undefined}
                  onChange={e => change('disabilityConsent', e.target.checked)} />
                <div>
                  <label htmlFor="register-consent">
                    Autorizo el tratamiento de mis datos de discapacidad para adaptar la interfaz.
                  </label>
                  <p id="register-consent-hint" className="muted">
                    Solo se usan para personalizar tu experiencia. Puedes retirar el consentimiento en cualquier momento.
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
              {tools.length ? <ul>{tools.map(t => <li key={t}>{TOOL_LABELS[t]}</li>)}</ul>
                : <p>Verás el catálogo general con accesibilidad básica.</p>}
            </section>
            <div className="actions">
              <button className="btn btn-primary" type="submit">Continuar</button>
              <button className="btn btn-ghost" type="button" onClick={() => setStep(1)}>Volver</button>
            </div>
          </form>
        )}

        {/* Paso 3: cuestionario de nivel */}
        {step === 3 && currentNeedKey && (
          <>
            <h1 style={{ marginBottom: '0.5rem' }}>
              Cuéntanos cómo te afecta: {disabilityLabel(currentNeedKey)} ({levelIdx + 1}/{realNeeds.length})
            </h1>
            <LevelQuestionnaire
              needKey={currentNeedKey}
              answers={levelAnswers[currentNeedKey] ?? []}
              onChange={(idx, val) => handleLevelAnswer(currentNeedKey, idx, val)}
              onFinish={finishNeed}
              onBack={handleBackInQuestionnaire}
              onSkip={skipQuestionnaire}
            />
          </>
        )}

        {/* Paso 4: confirmación */}
        {step === 4 && (
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
              {Object.keys(computedLevels).length > 0 && (
                <div>
                  <dt>Niveles registrados</dt>
                  <dd>
                    {(Object.entries(computedLevels) as [DisabilityNeedKey, DisabilityLevelData][])
                      .map(([k, v]) => `${disabilityLabel(k)}: ${LEVEL_LABELS[v.level]}`)
                      .join(' · ')}
                  </dd>
                </div>
              )}
            </dl>
            {regError && (
              <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {regError}</p>
            )}
            <div className="actions">
              <button className="btn btn-primary" onClick={confirm} disabled={saving}>
                {saving ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(step === 4 && realNeeds.length > 0 && values.disabilityConsent ? 3 : 2)}>
                Volver y editar
              </button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

/* ── Página de confirmación ──────────────────────────────────────────────── */
interface ConfirmationState { name?: string; email?: string; password?: string; }

export function RegistrationConfirmationPage() {
  const { state }     = useLocation();
  const credentials   = (state ?? {}) as ConfirmationState;
  const [show, setShow] = useState(false);

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
                  <input aria-label="Contraseña creada" readOnly
                    type={show ? 'text' : 'password'} value={credentials.password ?? ''} />
                </dd>
              </div>
            </dl>
          ) : (
            <p className="muted">Vuelve a iniciar sesión con el correo y la contraseña que elegiste.</p>
          )}
          <p className="muted">Guarda estos datos. Tu contraseña no se muestra en tu perfil.</p>
          <div className="actions">
            {credentials.password && (
              <button className="btn btn-ghost" aria-pressed={show} onClick={() => setShow(v => !v)}>
                {show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            )}
            <Link className="btn btn-primary" to="/login" state={credentials}>Ir a iniciar sesión</Link>
          </div>
        </div>
      </main>
    </>
  );
}
