import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { SkipLink } from '../../shared/SkipLink';

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <SkipLink />
      <main id="main-content" className="page">
        <h1>Mi perfil</h1>
        <div className="card">
          <p><strong>Nombre:</strong> {user?.name}</p>
          <p><strong>Correo:</strong> {user?.email}</p>
          <p><strong>Necesidades:</strong> {user?.disabilities.join(', ') || 'No indicadas'}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link className="btn btn-primary" to="/profile/accessibility">Configuración de accesibilidad</Link>
            <Link className="btn btn-secondary" to="/orders">Mis pedidos</Link>
          </div>
        </div>
      </main>
    </>
  );
}
