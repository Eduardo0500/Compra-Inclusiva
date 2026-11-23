import { Link } from 'react-router-dom';
import { useShop } from '../../app/ShopContext';
import { useAccessibility } from '../../app/AccessibilityContext';
import { SkipLink } from '../../shared/SkipLink';
import { PRODUCTS } from '../catalog/products';

export function CartPage() {
  const { cart, setQuantity, removeFromCart } = useShop();
  const { announce } = useAccessibility();
  const items = PRODUCTS.filter((product) => cart[product.id]);
  const total = items.reduce((sum, product) => sum + product.price * cart[product.id], 0);

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page">
        <h1>Carrito de compras</h1>
        {items.length === 0 ? (
          <div className="card">
            <p>Tu carrito está vacío.</p>
            <Link className="btn btn-primary" to="/catalog">Ver productos</Link>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((product) => (
                <article className="cart-row" key={product.id}>
                  <div>
                    <h2>{product.name}</h2>
                    <p>${product.price.toLocaleString('es-CO')} cada uno</p>
                  </div>
                  <div className="cart-controls">
                    <label htmlFor={`qty-${product.id}`}>Cantidad</label>
                    <input
                      id={`qty-${product.id}`}
                      type="number"
                      min="1"
                      max={product.stock}
                      value={cart[product.id]}
                      onChange={(event) => {
                        setQuantity(product.id, Number(event.target.value));
                        announce(`Cantidad de ${product.name}: ${event.target.value}`);
                      }}
                    />
                    <button className="btn btn-ghost" onClick={() => removeFromCart(product.id)}>Eliminar</button>
                  </div>
                  <strong>${(product.price * cart[product.id]).toLocaleString('es-CO')}</strong>
                </article>
              ))}
            </div>
            <div className="card purchase-summary">
              <h2>Resumen</h2>
              <p>Subtotal: ${total.toLocaleString('es-CO')}</p>
              <p><strong>Total: ${total.toLocaleString('es-CO')}</strong></p>
              <Link className="btn btn-primary" to="/checkout">Continuar con la compra</Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
