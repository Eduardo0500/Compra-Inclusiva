import { Link, useParams } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useShop } from '../../app/ShopContext';
import { formatPrice } from '../../services/catalog';

export function OrdersPage() {
  const { orders, getOrder } = useShop();
  const { id } = useParams();
  const selected = id ? getOrder(id) : null;

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page" tabIndex={-1}>
        <nav aria-label="Migas de pan">
          <Link to="/profile">Mi perfil</Link> <span aria-hidden="true">›</span>{' '}
          <span aria-current="page">Mis pedidos</span>
        </nav>
        <h1>{selected ? `Pedido ${selected.id}` : 'Mis pedidos'}</h1>
        {selected ? (
          <article className="card stack">
            <dl className="summary-list">
              <div><dt>Fecha</dt><dd>{new Date(selected.date).toLocaleString('es-CO')}</dd></div>
              <div><dt>Estado</dt><dd><span className="tag">{selected.status}</span></dd></div>
              <div><dt>Entrega</dt><dd>{selected.delivery.fullName} · {selected.delivery.address}, {selected.delivery.city}</dd></div>
              <div><dt>Pago</dt><dd>{selected.delivery.paymentMethod === 'efectivo' ? 'Contra entrega' : 'Tarjeta de demostración'}</dd></div>
            </dl>
            <h2>Productos comprados</h2>
            <table className="data-table">
              <thead><tr><th scope="col">Producto</th><th scope="col">Cantidad</th><th scope="col">Precio unitario</th><th scope="col">Subtotal</th></tr></thead>
              <tbody>
                {selected.items.map((item) => (
                  <tr key={item.productId}>
                    <th scope="row">{item.name}</th>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{formatPrice(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="order-total"><strong>Total del pedido: {formatPrice(selected.total)}</strong></p>
            <p className="muted">Pedido de demostración. No se realizó ningún cobro real.</p>
            <Link className="btn btn-ghost" to="/orders">Volver a mis pedidos</Link>
          </article>
        ) : orders.length === 0 ? (
          <div className="card stack" role="status">
            <h2>Aún no tienes pedidos</h2>
            <p>Cuando realices una compra, aparecerá aquí con su fecha, productos y estado.</p>
            <Link className="btn btn-primary" to="/catalog">Ver productos</Link>
          </div>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article className="card order-card" key={order.id}>
                <div>
                  <h2>{order.id}</h2>
                  <p className="muted">{new Date(order.date).toLocaleDateString('es-CO')} · {order.status}</p>
                  <p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} producto(s) · <strong>{formatPrice(order.total)}</strong></p>
                </div>
                <Link className="btn btn-secondary" to={`/orders/${order.id}`}>
                  Ver detalle <span className="sr-only">del pedido {order.id}</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
