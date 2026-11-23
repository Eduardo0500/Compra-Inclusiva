import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { SimpleText } from '../../shared/SimpleText';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { useShop } from '../../app/ShopContext';
import { formatPrice, getProduct, relatedProducts } from '../../services/catalog';
import { catalogKindForUser } from '../../services/identity';

export function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useShop();
  const { announce } = useAccessibility();
  const [status, setStatus] = useState('');
  const product = id ? getProduct(id) : null;
  const kind = catalogKindForUser(user);

  if (!product) return <Navigate to={`/catalog/${kind}`} replace />;

  const add = () => {
    const ok = addToCart(product.id);
    const message = ok
      ? `${product.name} agregado al carrito.`
      : `No se pudo agregar ${product.name}. Revisa la disponibilidad.`;
    setStatus(message);
    announce(message);
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page product-detail" tabIndex={-1}>
        <nav aria-label="Migas de pan">
          <Link to={`/catalog/${kind}`}>Productos</Link> <span aria-hidden="true">›</span>{' '}
          <span aria-current="page">{product.name}</span>
        </nav>
        <article className="card detail-card" aria-labelledby="detail-title">
          <img src={product.image} alt={product.imageAlt} className="detail-image" />
          <div>
            <p className="product-category">{product.category}</p>
            <h1 id="detail-title">{product.name}</h1>
            <p className="product-description">
              <SimpleText full={product.description} simple={product.simpleDescription} />
            </p>
            <p className="product-price" aria-label={`Precio: ${formatPrice(product.price)}`}>{formatPrice(product.price)}</p>
            <p className={product.available && product.stock > 0 ? 'stock-ok' : 'stock-error'}>
              {product.available && product.stock > 0
                ? `Disponible · ${product.stock} unidades`
                : 'Agotado'}
            </p>
            <h2>Datos del producto</h2>
            <ul>
              {product.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
            <details className="transcript">
              <summary>Información en texto (transcripción)</summary>
              <p>{product.transcript}</p>
            </details>
            <div className="actions">
              <button className="btn btn-primary" onClick={add} disabled={!product.available || product.stock === 0}>
                Agregar al carrito <span className="sr-only">{product.name}</span>
              </button>
              <Link className="btn btn-secondary" to="/cart">Ir a mi carrito</Link>
            </div>
            {status && <p className="feedback feedback-ok" role="status"><span aria-hidden="true">✓</span> {status}</p>}
          </div>
        </article>
        <section aria-labelledby="related-title">
          <h2 id="related-title">También de {product.category}</h2>
          <div className="product-grid">
            {relatedProducts(product).map((related) => (
              <article className="product-card" key={related.id}>
                <img src={related.image} alt={related.imageAlt} className="product-image" />
                <div className="product-body">
                  <h3><Link to={`/producto/${related.id}`}>{related.name}</Link></h3>
                  <p className="product-price">{formatPrice(related.price)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
