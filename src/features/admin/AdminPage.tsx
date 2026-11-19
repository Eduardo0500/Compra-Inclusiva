/**
 * AdminPage – panel de administración.
 * Muestra todos los usuarios registrados con sus discapacidades y preferencias.
 */
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useUserRegistry } from '../../app/UserRegistryContext';
import type { AccessibilityPreferences } from '../../types/accessibility';
import type { User } from '../../types/user';

const DISABILITY_LABELS: Record<string, string> = {
  visual: 'Visual',
  auditiva: 'Auditiva',
  motriz: 'Motriz',
  cognitiva: 'Cognitiva',
  ninguna: 'Ninguna',
};

function prefsResumen(p: AccessibilityPreferences): string {
  const activas: string[] = [];
  if (p.highContrast)    activas.push('Alto contraste');
  if (p.largeButtons)    activas.push('Botones grandes');
  if (p.captions)        activas.push('Subtítulos');
  if (p.signLanguage)    activas.push('Lengua de señas');
  if (p.visualAlerts)    activas.push('Alertas visuales');
  if (p.simpleLanguage)  activas.push('Lenguaje simple');
  if (p.textScale !== 1) activas.push(`Texto ${p.textScale * 100}%`);
  return activas.length ? activas.join(', ') : 'Ninguna';
}

function formatFecha(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch { return iso; }
}

export function AdminPage() {
  const { user, logout } = useAuth();
  const { users, removeUser } = useUserRegistry();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtroDisc, setFiltroDisc] = useState('');

  // Leer también de sessionStorage por si el estado React aún no propagó
  const sessionUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('session-user') ?? 'null'); } catch { return null; }
  })();
  const userEfectivo = user ?? sessionUser;

  // Protección: si no es admin, redirigir al login
  if (!userEfectivo || userEfectivo.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const filtrados = users.filter((u) => {
    const coincideBusqueda =
      u.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideDisc = !filtroDisc || u.disability === filtroDisc;
    return coincideBusqueda && coincideDisc;
  });

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f5f5f5' }}>

      {/* CABECERA */}
      <header style={{
        background: '#005fcc', color: '#fff',
        padding: '1rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>🛡 Panel de Administración</h1>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>CompraFácil Inclusiva</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem' }}>Sesión: <strong>{userEfectivo.name}</strong></span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              background: 'transparent', color: '#fff',
              border: '2px solid #fff', borderRadius: 6,
              padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ padding: '1.5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* TARJETAS RESUMEN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Tarjeta titulo="Total usuarios" valor={users.length} />
          <Tarjeta titulo="Con discapacidad" valor={users.filter(u => u.disability && u.disability !== 'ninguna').length} />
          <Tarjeta titulo="Con consentimiento" valor={users.filter(u => u.disabilityConsent).length} />
          <Tarjeta titulo="Alto contraste" valor={users.filter(u => u.accessibilityPreferences.highContrast).length} />
        </div>

        {/* FILTROS */}
        <div style={{
          background: '#fff', border: '1px solid #ccc', borderRadius: 8,
          padding: '1rem', marginBottom: '1.5rem',
          display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 200px' }}>
            <label htmlFor="buscar" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Buscar</label>
            <input
              id="buscar"
              type="search"
              placeholder="Nombre o correo…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ padding: '0.5rem', border: '1px solid #aaa', borderRadius: 6, fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 180px' }}>
            <label htmlFor="filtro-disc" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Discapacidad</label>
            <select
              id="filtro-disc"
              value={filtroDisc}
              onChange={e => setFiltroDisc(e.target.value)}
              style={{ padding: '0.5rem', border: '1px solid #aaa', borderRadius: 6, fontSize: '0.95rem' }}
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

        {/* TABLA */}
        <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #005fcc' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Usuarios registrados &nbsp;
              <span style={{ color: '#666', fontWeight: 400 }}>
                ({filtrados.length}{filtrados.length !== users.length ? ` de ${users.length}` : ''})
              </span>
            </h2>
          </div>

          {filtrados.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              {users.length === 0 ? 'No hay usuarios registrados.' : 'Sin resultados para los filtros aplicados.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    {['Nombre', 'Correo', 'Discapacidad', 'Consentimiento', 'Preferencias de accesibilidad', 'Registro', 'Acción'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', borderBottom: '1px solid #ddd' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u, i) => (
                    <FilaUsuario
                      key={u.id}
                      user={u}
                      zebra={i % 2 === 1}
                      onEliminar={() => {
                        if (window.confirm(`¿Eliminar a ${u.name}?`)) removeUser(u.id);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function Tarjeta({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ccc', borderRadius: 8,
      padding: '1rem', textAlign: 'center',
    }}>
      <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#005fcc' }}>{valor}</p>
      <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem' }}>{titulo}</p>
    </div>
  );
}

function FilaUsuario({ user, zebra, onEliminar }: { user: User; zebra: boolean; onEliminar: () => void }) {
  const disc = user.disability ? (DISABILITY_LABELS[user.disability] ?? user.disability) : '—';
  const prefs = prefsResumen(user.accessibilityPreferences);

  return (
    <tr style={{ background: zebra ? '#fafafa' : '#fff', borderBottom: '1px solid #eee' }}>
      <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>{user.name}</td>
      <td style={{ padding: '0.65rem 1rem', color: '#444' }}>{user.email}</td>
      <td style={{ padding: '0.65rem 1rem' }}>
        {user.disability && user.disability !== 'ninguna' ? (
          <span style={{
            background: '#e8f0fe', color: '#1a56cc',
            borderRadius: 999, padding: '0.2rem 0.65rem',
            fontSize: '0.82rem', fontWeight: 700,
          }}>
            {disc}
          </span>
        ) : (
          <span style={{ color: '#888' }}>{disc}</span>
        )}
      </td>
      <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
        {user.disabilityConsent ? (
          <span style={{ color: '#1b6e1b', fontWeight: 700 }}>✔ Sí</span>
        ) : (
          <span style={{ color: '#888' }}>✘ No</span>
        )}
      </td>
      <td style={{ padding: '0.65rem 1rem', color: '#444', fontSize: '0.85rem', maxWidth: 260 }}>{prefs}</td>
      <td style={{ padding: '0.65rem 1rem', color: '#666', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
        {formatFecha(user.registeredAt)}
      </td>
      <td style={{ padding: '0.65rem 1rem' }}>
        <button
          onClick={onEliminar}
          style={{
            background: 'transparent', color: '#b00020',
            border: '1px solid #b00020', borderRadius: 6,
            padding: '0.25rem 0.65rem', cursor: 'pointer', fontSize: '0.82rem',
          }}
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}
