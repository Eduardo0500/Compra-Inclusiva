/**
 * AccessibilityProfilePage – perfil de accesibilidad del usuario.
 * Las mismas opciones del panel flotante, pero en página completa con más detalle.
 * Los cambios se guardan en el perfil y se aplican inmediatamente.
 */
import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import type { AccessibilityPreferences } from '../../types/accessibility';

type Scale = AccessibilityPreferences['textScale'];
const SCALES: { value: Scale; label: string }[] = [
  { value: 1, label: '100 % (predeterminado)' },
  { value: 1.25, label: '125 %' },
  { value: 1.5, label: '150 %' },
  { value: 1.75, label: '175 %' },
  { value: 2, label: '200 % (máximo)' },
];

export function AccessibilityProfilePage() {
  const { prefs, updatePref, resetPrefs, announce } = useAccessibility();
  const { user } = useAuth();

  function toggle<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K],
    onLabel: string,
    offLabel: string
  ) {
    updatePref(key, value);
    announce(value ? onLabel : offLabel);
  }

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page">
        <nav aria-label="Migas de pan">
          <Link to="/login">Inicio</Link>
          {' › '}
          <span aria-current="page">Perfil de accesibilidad</span>
        </nav>

        <h1 style={{ marginTop: '1rem' }}>
          Perfil de accesibilidad
          {user && (
            <span style={{ fontWeight: 400, fontSize: 'var(--font-size-base)', marginLeft: '0.5rem' }}>
              — {user.name}
            </span>
          )}
        </h1>

        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
          Personaliza cómo se ve y se comporta la aplicación. Los cambios se aplican de inmediato y
          se guardan para la próxima vez que inicies sesión.
        </p>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Visual */}
          <section aria-labelledby="section-visual">
            <h2 id="section-visual" style={{ marginBottom: '1rem' }}>Visual</h2>

            <TogglePref
              id="profile-contrast"
              label="Alto contraste"
              description="Texto blanco sobre negro. Útil para baja visión o poca iluminación."
              checked={prefs.highContrast}
              onChange={(v) => toggle('highContrast', v, 'Alto contraste activado', 'Alto contraste desactivado')}
            />

            <div className="field" style={{ marginTop: '1rem' }}>
              <label htmlFor="profile-text-scale">
                Tamaño de texto
              </label>
              <span className="hint">El texto se amplía hasta 200 % sin perder contenido ni funciones.</span>
              <select
                id="profile-text-scale"
                value={prefs.textScale}
                onChange={(e) => {
                  const v = Number(e.target.value) as Scale;
                  updatePref('textScale', v);
                  announce(`Texto al ${SCALES.find(s => s.value === v)?.label}`);
                }}
                style={{ marginTop: '0.4rem' }}
              >
                {SCALES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Motriz */}
          <section aria-labelledby="section-motor">
            <h2 id="section-motor" style={{ marginBottom: '1rem' }}>Motriz</h2>
            <TogglePref
              id="profile-large-buttons"
              label="Botones grandes"
              description="Área de toque mínima 56 × 56 px. Facilita el uso con temblor o movilidad reducida."
              checked={prefs.largeButtons}
              onChange={(v) => toggle('largeButtons', v, 'Botones grandes activados', 'Botones grandes desactivados')}
            />
          </section>

          {/* Auditiva */}
          <section aria-labelledby="section-audio">
            <h2 id="section-audio" style={{ marginBottom: '1rem' }}>Auditiva</h2>
            <TogglePref
              id="profile-captions"
              label="Subtítulos"
              description="Activados en videos grabados y videollamadas en directo."
              checked={prefs.captions}
              onChange={(v) => toggle('captions', v, 'Subtítulos activados', 'Subtítulos desactivados')}
            />
            <TogglePref
              id="profile-sign-language"
              label="Lengua de señas"
              description="Muestra intérprete de señas en videos y videollamadas cuando está disponible."
              checked={prefs.signLanguage}
              onChange={(v) => toggle('signLanguage', v, 'Lengua de señas activada', 'Lengua de señas desactivada')}
            />
            <TogglePref
              id="profile-visual-alerts"
              label="Alertas visuales y vibración"
              description="Las alertas sonoras se complementan con parpadeo de pantalla y vibración del dispositivo."
              checked={prefs.visualAlerts}
              onChange={(v) => toggle('visualAlerts', v, 'Alertas visuales activadas', 'Alertas visuales desactivadas')}
            />
          </section>

          {/* Cognitiva */}
          <section aria-labelledby="section-cognitive">
            <h2 id="section-cognitive" style={{ marginBottom: '1rem' }}>Cognitiva</h2>
            <TogglePref
              id="profile-simple-language"
              label="Lenguaje simple"
              description="Textos con frases cortas y vocabulario cotidiano. Nivel de lectura reducido."
              checked={prefs.simpleLanguage}
              onChange={(v) => toggle('simpleLanguage', v, 'Lenguaje simple activado', 'Lenguaje simple desactivado')}
            />
          </section>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => { resetPrefs(); announce('Preferencias restablecidas a valores predeterminados.'); }}>
              Restablecer todo a valores predeterminados
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

interface TogglePrefProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function TogglePref({ id, label, description, checked, onChange }: TogglePrefProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div>
        <label
          htmlFor={id}
          style={{ fontWeight: 600, cursor: 'pointer', display: 'block' }}
        >
          {label}
        </label>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '0.2rem' }}>
          {description}
        </p>
      </div>
      {/* switch accesible (WCAG 4.1.2) */}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          minWidth: 56,
          minHeight: 32,
          borderRadius: 16,
          border: '2px solid var(--color-border)',
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
        }}
        aria-label={label}
      >
        <span className="sr-only">{checked ? 'Activado' : 'Desactivado'}</span>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 'calc(100% - 26px)' : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}
