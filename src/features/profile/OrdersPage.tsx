import { Link, useParams } from 'react-router-dom';
import { useShop } from '../../app/ShopContext';
import { SkipLink } from '../../shared/SkipLink';

export function OrdersPage() {
  const { orders } = useShop();
  const { id } = useParams();
  const selected = id ? orders.find((order) => order.id === id) : null;
  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page">
        <h1>{selected ? `Pedido ${selected.id}` : 'Mis pedidos'}</h1>
        {selected ? (
          <article className="card">
            <p><strong>Fecha:</strong> {new Date(selected.date).toLocaleString('es-CO')}</p>
            <p><strong>Estado:</strong> {selected.status}</p>
            <h2>Productos</h2>
            {selected.items.map((item) => <p key={item.productId}>{item.quantity} × {item.name} — ${(item.quantity * item.price).toLocaleString('es-CO')}</p>)}
            <p><strong>Total: ${selected.total.toLocaleString('es-CO')}</strong></p>
            <Link className="btn btn-ghost" to="/orders">Volver a mis pedidos</Link>
          </article>
        ) : orders.length === 0 ? (
          <p>No tienes pedidos todavía.</p>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article className="card" key={order.id}>
                <h2>{order.id}</h2>
                <p>{new Date(order.date).toLocaleDateString('es-CO')} · {order.status}</p>
                <p><strong>${order.total.toLocaleString('es-CO')}</strong></p>
                <Link className="btn btn-secondary" to={`/orders/${order.id}`}>Ver detalle</Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
