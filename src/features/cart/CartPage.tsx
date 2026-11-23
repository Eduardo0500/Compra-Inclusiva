import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useShop } from '../../app/ShopContext';
import { cartLines, formatPrice } from '../../services/catalog';
import { catalogKindForUser } from '../../services/identity';
import { useAuth } from '../../app/AuthContext';

export function CartPage() {
  const { cart, setQuantity, removeFromCart, clearCart, subtotal, cartCount } = useShop();
  const { announce } = useAccessibility();
  const { user } = useAuth();
  const lines = cartLines(cart);
  const kind = catalogKindForUser(user);

  const changeQuantity = (id: string, name: string, next: number) => {
    setQuantity(id, next);
    announce(`Cantidad de ${name}: ${Math.max(0, next)}.`);
  };

  const remove = (id: string, name: string) => {
    removeFromCart(id);
    announce(`${name} eliminado del carrito.`);
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page" tabIndex={-1}>
        <h1>Mi carrito</h1>
        {lines.length === 0 ? (
          <div className="card stack" role="status">
            <h2>Tu carrito está vacío</h2>
            <p>Busca productos y agrégalos para continuar.</p>
            <Link className="btn btn-primary" to={`/catalog/${kind}`}>Ver productos</Link>
          </div>
        ) : (
          <>
            <p className="muted" role="status">{cartCount} producto{cartCount === 1 ? '' : 's'} en tu carrito.</p>
            <div className="cart-list">
              {lines.map(({ product, quantity, subtotal: lineSubtotal }) => (
                <article className="cart-row" key={product.id} aria-labelledby={`cart-${product.id}`}>
                  <img src={product.image} alt="" className="cart-thumb" />
                  <div>
                    <h2 id={`cart-${product.id}`}>{product.name}</h2>
                    <p className="muted">{product.category} · {formatPrice(product.price)} cada uno</p>
                  </div>
                  <div className="cart-controls">
                    <span id={`qty-label-${product.id}`}>Cantidad</span>
                    <div className="quantity-controls" role="group" aria-labelledby={`qty-label-${product.id}`}>
                      <button className="btn btn-secondary" type="button"
                        aria-label={`Reducir cantidad de ${product.name}`}
                        onClick={() => changeQuantity(product.id, product.name, quantity - 1)}>−</button>
                      <output aria-live="polite">{quantity}</output>
                      <button className="btn btn-secondary" type="button"
                        aria-label={`Aumentar cantidad de ${product.name}`}
                        disabled={quantity >= product.stock}
                        onClick={() => changeQuantity(product.id, product.name, quantity + 1)}>+</button>
                    </div>
                    <button className="btn btn-ghost" type="button"
                      aria-label={`Eliminar ${product.name} del carrito`}
                      onClick={() => remove(product.id, product.name)}>Eliminar</button>
                  </div>
                  <strong className="cart-subtotal">{formatPrice(lineSubtotal)}</strong>
                </article>
              ))}
            </div>
            <div className="purchase-summary card">
              <h2>Resumen de compra</h2>
              <dl className="summary-list">
                <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
                <div><dt>Envío</dt><dd>Se coordina con la entrega</dd></div>
                <div><dt>Total</dt><dd><strong>{formatPrice(subtotal)}</strong></dd></div>
              </dl>
              <div className="actions">
                <Link className="btn btn-primary" to="/checkout">Continuar con la compra</Link>
                <Link className="btn btn-secondary" to={`/catalog/${kind}`}>Seguir comprando</Link>
                <button className="btn btn-ghost" type="button"
                  onClick={() => {
                    clearCart();
                    announce('Carrito vaciado.');
                  }}>
                  Vaciar carrito
                </button>
              </div>
              <p className="muted">Esta tienda no procesa pagos reales. La compra se confirma al final del proceso.</p>
            </div>
          </>
        )}
      </main>
    </>
  );
}
