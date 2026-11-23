import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useShop } from '../app/ShopContext';

export function AppNav() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useShop();
  const navigate = useNavigate();
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  if (!isAuthenticated) return null;

  return (
    <header className="app-header">
      <Link className="brand" to="/catalog" aria-label="CompraFácil Inclusiva - inicio">
        CompraFácil Inclusiva
      </Link>
      <nav aria-label="Navegación principal" className="main-nav">
        <NavLink to="/catalog">Inicio</NavLink>
        <NavLink to="/catalog">Productos</NavLink>
        <NavLink to="/catalog">Categorías</NavLink>
        <NavLink to="/cart">Carrito ({cartCount})</NavLink>
        <NavLink to="/orders">Mis pedidos</NavLink>
        <NavLink to="/profile">Mi perfil</NavLink>
        <NavLink to="/chat">Ayuda</NavLink>
      </nav>
      <div className="nav-user">
        <span>{user?.name}</span>
        <button className="btn btn-ghost" onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</button>
      </div>
    </header>
  );
}
