import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import {
  CATALOG_KIND_LABELS, DISABILITY_OPTIONS, TOOL_LABELS,
  applyRecommendations, catalogKindForNeeds, needsForUser, recommendedToolsForNeeds,
} from '../../services/identity';
import type { DisabilityType } from '../../types/user';

export function AccessibilityNeedsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { prefs, announce } = useAccessibility();
  const currentNeeds = needsForUser(user);
  const [needs, setNeeds] = useState<DisabilityType[]>(currentNeeds.length ? currentNeeds : ['no_indica']);
  const [consent, setConsent] = useState(Boolean(user?.disabilityConsent));
  const [error, setError] = useState('');

  const hasRealNeeds = needs.some((item) => ['visual', 'auditiva', 'motriz', 'cognitiva'].includes(item));
  const kind = catalogKindForNeeds(hasRealNeeds && !consent ? [] : needs);
  const tools = recommendedToolsForNeeds(hasRealNeeds && !consent ? [] : needs);

  const toggle = (value: DisabilityType, checked: boolean) => {
    const exclusive = value === 'ninguna' || value === 'no_indica';
    setNeeds(checked
      ? exclusive ? [value] : [...needs.filter((item) => item !== 'ninguna' && item !== 'no_indica'), value]
      : needs.filter((item) => item !== value));
    setError('');
  };

  const save = () => {
    if (hasRealNeeds && !consent) {
      const message = 'Necesitamos tu consentimiento para guardar y usar tus necesidades de accesibilidad.';
      setError(message);
      announce(message);
      return;
    }
    if (!user) return;
    const declared: DisabilityType[] = hasRealNeeds ? needs : ['no_indica'];
    updateUser({
      ...user,
      disabilities: declared,
      disability: declared[0] ?? null,
      disabilityConsent: hasRealNeeds && consent,
      accessibilityPreferences: applyRecommendations(prefs, hasRealNeeds ? needs : []),
    });
    announce(`Necesidades actualizadas. Catálogo asignado: ${CATALOG_KIND_LABELS[kind]}.`);
    navigate(`/catalog/${kind}`);
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page" tabIndex={-1}>
        <nav aria-label="Migas de pan">
          <Link to="/profile">Mi perfil</Link> <span aria-hidden="true">›</span>{' '}
          <span aria-current="page">Necesidades de accesibilidad</span>
        </nav>
        <h1>Cambiar mis necesidades</h1>
        <p className="muted">Puedes elegir varias opciones. Tu carrito, pedidos y preferencias se conservan.</p>
        <form className="card stack" noValidate onSubmit={(event) => { event.preventDefault(); save(); }}>
          <fieldset className="choice-group">
            <legend>Mis necesidades</legend>
            {DISABILITY_OPTIONS.map((option) => (
              <label className="choice" key={option.value}>
                <input type="checkbox" checked={needs.includes(option.value)}
                  onChange={(event) => toggle(option.value, event.target.checked)} />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          {hasRealNeeds && (
            <div className="consent-box">
              <input id="needs-consent" type="checkbox" checked={consent}
                aria-describedby="needs-consent-hint"
                onChange={(event) => setConsent(event.target.checked)} />
              <div>
                <label htmlFor="needs-consent">Consiento el tratamiento de estos datos para personalizar mi experiencia.</label>
                <p id="needs-consent-hint" className="muted">Puedes retirar este consentimiento cuando quieras.</p>
              </div>
            </div>
          )}
          {error && <p className="error-msg" role="alert"><span aria-hidden="true">⚠</span> {error}</p>}
          <section className="preview-box" aria-labelledby="needs-preview">
            <h2 id="needs-preview">Resultado</h2>
            <p><strong>Catálogo:</strong> {CATALOG_KIND_LABELS[kind]}</p>
            <p><strong>Herramientas que se aplicarán:</strong> {tools.length ? tools.map((tool) => TOOL_LABELS[tool]).join(', ') : 'Accesibilidad básica'}</p>
          </section>
          <div className="actions">
            <button className="btn btn-primary" type="submit">Guardar necesidades</button>
            <button className="btn btn-ghost" type="button" onClick={() => {
              updateUser({
                ...(user as NonNullable<typeof user>),
                disabilities: ['no_indica'],
                disability: 'no_indica',
                disabilityConsent: false,
              });
              announce('Consentimiento retirado. Se usarán el catálogo general y tus preferencias actuales.');
              navigate('/catalog/general');
            }}>
              Retirar consentimiento
            </button>
            <Link className="btn btn-ghost" to="/profile">Cancelar</Link>
          </div>
        </form>
      </main>
    </>
  );
}
