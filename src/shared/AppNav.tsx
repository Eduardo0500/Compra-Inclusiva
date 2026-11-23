import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useShop } from '../app/ShopContext';
import { useAccessibility } from '../app/AccessibilityContext';

const LINKS = [
  { to: '/catalog', label: 'Inicio', end: false },
  { to: '/catalog', label: 'Productos', end: false },
  { to: '/categories', label: 'Categorías', end: true },
  { to: '/cart', label: 'Mi carrito', end: true },
  { to: '/orders', label: 'Mis pedidos', end: true },
  { to: '/profile', label: 'Mi perfil', end: true },
  { to: '/chat', label: 'Ayuda', end: true },
];

export function AppNav() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useShop();
  const { announce } = useAccessibility();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  return (
    <header className="app-header">
      <NavLink className="brand" to="/catalog" aria-label="CompraFácil Inclusiva, ir al inicio">
        <span aria-hidden="true">♿</span> CompraFácil Inclusiva
      </NavLink>
      <nav aria-label="Navegación principal" className="main-nav">
        {LINKS.map((link, index) => (
          <NavLink
            key={`${link.label}-${index}`}
            to={link.to}
            end={link.end}
            className={({ isActive }) => isActive ? 'active' : undefined}
          >
            {link.label}{link.label === 'Mi carrito' ? ` (${cartCount})` : ''}
          </NavLink>
        ))}
      </nav>
      <div className="nav-user">
        <span className="nav-name">{user?.name}</span>
        <button
          className="btn btn-ghost"
          onClick={() => {
            logout();
            announce('Sesión cerrada.');
            navigate('/welcome');
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
