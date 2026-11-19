/**
 * AdminPage – panel de administración.
 * Muestra todos los usuarios registrados con sus datos de discapacidad
 * y preferencias de accesibilidad.
 * Solo accesible con rol 'admin'.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import { SkipLink } from '../../shared/SkipLink';
import type { User } from '../../types/user';
import type { AccessibilityPreferences } from '../../types/accessibility';

// ── Helpers de presentación ──────────────────────────────────────────────────

const DISABILITY_LABELS: Record<string, string> = {
  visual:    'Visual',
  auditiva:  'Auditiva',
  motriz:    'Motriz',
  cognitiva: 'Cognitiva',
  ninguna:   'Ninguna',
};

function disabilityLabel(d: string | null): string {
  if (!d) return '—';
  return DISABILITY_LABELS[d] ?? d;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Convierte las preferencias de accesibilidad a un resumen legible */
function prefsToTags(p: AccessibilityPreferences): string[] {
  const tags: string[] = [];
  if (p.highContrast)   tags.push('Alto contraste');
  if (p.largeButtons)   tags.push('Botones grandes');
  if (p.captions)       tags.push('Subtítulos');
  if (p.signLanguage)   tags.push('Lengua de señas');
  if (p.visualAlerts)   tags.push('Alertas visuales');
  if (p.simpleLanguage) tags.push('Lenguaje simple');
  if (p.textScale !== 1) tags.push(`Texto ×${p.textScale}`);
  return tags.length ? tags : ['Sin preferencias activas'];
}

// ── Página principal ─────────────────────────────────────────────────────────

export function AdminPage() {
  const { user, logout } = useAuth();
  const { users, removeUser } = useUserRegistry();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterDisability, setFilterDisability] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchDisability =
      !filterDisability || u.disability === filterDisability;
    return matchSearch && matchDisability;
  });

  return (
    <>
      <SkipLink />
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}
      >
        {/* ── Barra de cabecera ───────────────────────────────────────── */}
        <header
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>
            Panel de Administración
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>
              Sesión: <strong>{user?.name}</strong>
            </span>
            <button
              className="btn btn-ghost"
              style={{ color: '#fff', borderColor: '#fff' }}
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main id="main-content" style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
          {/* ── Estadísticas rápidas ──────────────────────────────────── */}
          <section
            aria-label="Estadísticas"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <StatCard label="Usuarios registrados" value={users.length} />
            <StatCard
              label="Con discapacidad declarada"
              value={users.filter((u) => u.disability && u.disability !== 'ninguna').length}
            />
            <StatCard
              label="Con consentimiento"
              value={users.filter((u) => u.disabilityConsent).length}
            />
            <StatCard
              label="Alto contraste activo"
              value={users.filter((u) => u.accessibilityPreferences.highContrast).length}
            />
          </section>

          {/* ── Filtros ───────────────────────────────────────────────── */}
          <section
            aria-label="Filtros de búsqueda"
            className="card"
            style={{ marginBottom: '1.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div className="field" style={{ flex: '1 1 220px', marginBottom: 0 }}>
                <label htmlFor="search-users">Buscar por nombre o correo</label>
                <input
                  id="search-users"
                  type="search"
                  placeholder="Buscar…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar usuarios por nombre o correo"
                />
              </div>
              <div className="field" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                <label htmlFor="filter-disability">Filtrar por discapacidad</label>
                <select
                  id="filter-disability"
                  value={filterDisability}
                  onChange={(e) => setFilterDisability(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="visual">Visual</option>
                  <option value="auditiva">Auditiva</option>
                  <option value="motriz">Motriz</option>
                  <option value="cognitiva">Cognitiva</option>
                  <option value="ninguna">Ninguna</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── Tabla de usuarios ─────────────────────────────────────── */}
          <section aria-label="Lista de usuarios registrados">
            <h2 style={{ marginBottom: '0.75rem', fontSize: 'var(--font-size-lg)' }}>
              Usuarios registrados{' '}
              <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
                ({filtered.length}{filtered.length !== users.length ? ` de ${users.length}` : ''})
              </span>
            </h2>

            {filtered.length === 0 ? (
              <p
                className="card"
                style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}
              >
                {users.length === 0
                  ? 'Todavía no hay usuarios registrados.'
                  : 'Ningún usuario coincide con los filtros aplicados.'}
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 'var(--font-size-sm)',
                  }}
                  aria-label="Tabla de usuarios"
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderBottom: '2px solid var(--color-border)',
                      }}
                    >
                      {['Nombre', 'Correo', 'Discapacidad', 'Consentimiento', 'Registro', 'Acciones'].map(
                        (h) => (
                          <th
                            key={h}
                            scope="col"
                            style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700 }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: i % 2 === 0 ? 'var(--color-bg)' : 'var(--color-surface)',
                        }}
                      >
                        <td style={{ padding: '0.6rem 0.75rem' }}>{u.name}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{u.email}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{disabilityLabel(u.disability)}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{u.disabilityConsent ? '✔ Sí' : '✘ No'}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{formatDate(u.registeredAt)}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <ExpandPrefsButton user={u} />
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: '0.25rem 0.65rem',
                              minHeight: 'unset',
                              fontSize: '0.8rem',
                              marginLeft: '0.5rem',
                              borderColor: 'var(--color-error)',
                              color: 'var(--color-error)',
                            }}
                            aria-label={`Eliminar usuario ${u.name}`}
                            onClick={() => {
                              if (confirm(`¿Eliminar al usuario ${u.name}? Esta acción no se puede deshacer.`)) {
                                removeUser(u.id);
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="card"
      style={{ textAlign: 'center' }}
      role="region"
      aria-label={label}
    >
      <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
        {label}
      </p>
    </div>
  );
}

function ExpandPrefsButton({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const tags = prefsToTags(user.accessibilityPreferences);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '0.25rem 0.65rem', minHeight: 'unset', fontSize: '0.8rem' }}
        aria-expanded={open}
        aria-label={`${open ? 'Ocultar' : 'Ver'} preferencias de ${user.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Ocultar' : 'Preferencias'}
      </button>
      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '110%',
            left: 0,
            zIndex: 10,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '0.6rem 0.9rem',
            minWidth: 200,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {tags.map((t) => (
              <li key={t} style={{ fontSize: '0.82rem', fontWeight: 600 }}>• {t}</li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
