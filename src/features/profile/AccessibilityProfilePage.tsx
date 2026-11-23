import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import {
  ALL_TOOLS, CATALOG_KIND_LABELS, TOOL_DESCRIPTIONS, TOOL_LABELS,
  catalogKindForUser, needsForUser, needsLabel, recommendedToolsForNeeds,
  type AccessibilityTool,
} from '../../services/identity';
import type { AccessibilityPreferences } from '../../types/accessibility';

const SCALES: AccessibilityPreferences['textScale'][] = [1, 1.25, 1.5, 1.75, 2];

export function AccessibilityProfilePage() {
  const { prefs, updatePref, resetPrefs, increaseText, decreaseText, announce } = useAccessibility();
  const { user } = useAuth();
  const needs = needsForUser(user);
  const recommended = recommendedToolsForNeeds(needs);
  const kind = catalogKindForUser(user);

  const isActive = (tool: AccessibilityTool) => {
    if (tool === 'textScale') return prefs.textScale > 1;
    if (tool === 'colorMode') return prefs.colorMode !== 'normal';
    return prefs[tool];
  };

  const change = (tool: AccessibilityTool, value: boolean | string) => {
    updatePref(tool as keyof AccessibilityPreferences, value as never);
    announce(`${TOOL_LABELS[tool]} ${typeof value === 'boolean' ? (value ? 'activado' : 'desactivado') : 'actualizado'}.`);
  };

  const renderTool = (tool: AccessibilityTool) => {
    if (tool === 'textScale') {
      return (
        <div className="preference-row" key={tool}>
          <div>
            <strong>{TOOL_LABELS[tool]}</strong>
            <p className="muted">{TOOL_DESCRIPTIONS[tool]}</p>
          </div>
          <div className="quantity-controls" role="group" aria-label="Tamaño del texto">
            <button className="btn btn-secondary" onClick={() => { decreaseText(); announce('Texto reducido.'); }} aria-label="Reducir texto">−</button>
            <output aria-live="polite">{Math.round(prefs.textScale * 100)} %</output>
            <button className="btn btn-secondary" onClick={() => { increaseText(); announce('Texto ampliado.'); }} aria-label="Aumentar texto">+</button>
          </div>
        </div>
      );
    }
    if (tool === 'colorMode') {
      return (
        <div className="preference-row" key={tool}>
          <label htmlFor="profile-color-mode"><strong>{TOOL_LABELS[tool]}</strong></label>
          <p className="muted">{TOOL_DESCRIPTIONS[tool]}</p>
          <select id="profile-color-mode" value={prefs.colorMode}
            onChange={(event) => change(tool, event.target.value)}>
            <option value="normal">Colores normales</option>
            <option value="blue-yellow">Azul y amarillo</option>
          </select>
        </div>
      );
    }
    return (
      <div className="preference-row" key={tool}>
        <div>
          <strong>{TOOL_LABELS[tool]}</strong>
          {recommended.includes(tool) && <span className="tag">Recomendada</span>}
          <p className="muted">{TOOL_DESCRIPTIONS[tool]}</p>
        </div>
        <button role="switch" aria-checked={isActive(tool)} aria-label={TOOL_LABELS[tool]}
          className={`switch ${isActive(tool) ? 'on' : ''}`}
          onClick={() => change(tool, !isActive(tool))}>
          <span className="sr-only">{isActive(tool) ? 'Activado' : 'Desactivado'}</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page" tabIndex={-1}>
        <nav aria-label="Migas de pan">
          <Link to="/profile">Mi perfil</Link> <span aria-hidden="true">›</span>{' '}
          <span aria-current="page">Configuración de accesibilidad</span>
        </nav>
        <div className="catalog-heading">
          <div>
            <h1>Configuración de accesibilidad</h1>
            <p>Los cambios se aplican en todas las páginas y se guardan en tu cuenta.</p>
          </div>
          <span className="mode-badge">{CATALOG_KIND_LABELS[kind]}</span>
        </div>
        <div className="profile-summary card" role="note">
          <p><strong>Necesidades declaradas:</strong> {needsLabel(needs)}</p>
          <p className="muted">Puedes cambiar tus necesidades sin crear otra cuenta.</p>
          <Link className="btn btn-secondary" to="/profile/needs">Cambiar mis necesidades</Link>
        </div>

        <section className="card stack" aria-labelledby="recommended-tools">
          <h2 id="recommended-tools">Mi configuración personalizada</h2>
          {recommended.length ? recommended.map(renderTool) : (
            <p className="muted">No has declarado necesidades. Todas las herramientas están en «Otras opciones».</p>
          )}
        </section>

        <section className="card stack" aria-labelledby="other-tools">
          <h2 id="other-tools">Otras opciones de accesibilidad</h2>
          {ALL_TOOLS.filter((tool) => !recommended.includes(tool)).map(renderTool)}
        </section>

        <section className="card stack" aria-labelledby="text-presets">
          <h2 id="text-presets">Tamaño de texto</h2>
          <p className="muted">Selecciona un tamaño. El contenido se reajusta sin perder información.</p>
          <div className="chips" role="group" aria-label="Tamaño de texto">
            {SCALES.map((scale) => (
              <button key={scale}
                className={prefs.textScale === scale ? 'chip selected' : 'chip'}
                aria-pressed={prefs.textScale === scale}
                onClick={() => { updatePref('textScale', scale); announce(`Texto al ${Math.round(scale * 100)} %`); }}>
                {Math.round(scale * 100)} %
              </button>
            ))}
          </div>
        </section>

        <div className="actions">
          <button className="btn btn-ghost" onClick={() => {
            resetPrefs();
            announce('Preferencias restablecidas.');
          }}>
            Restablecer valores predeterminados
          </button>
          <Link className="btn btn-primary" to={`/catalog/${kind}`}>Volver a mi catálogo</Link>
        </div>
      </main>
    </>
  );
}
