import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useShop } from '../../app/ShopContext';
import { useAuth } from '../../app/AuthContext';
import { useAccessibility } from '../../app/AccessibilityContext';
import { SkipLink } from '../../shared/SkipLink';
import { PRODUCTS } from '../catalog/products';

export function CheckoutPage() {
  const { cart, createOrder, clearCart } = useShop();
  const { user, updateUser } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [payment, setPayment] = useState<'efectivo' | 'tarjeta-demostracion'>('efectivo');
  const [delivery, setDelivery] = useState({
    fullName: user?.deliveryAddress?.fullName ?? user?.name ?? '',
    address: user?.deliveryAddress?.address ?? '',
    city: user?.deliveryAddress?.city ?? '',
    phone: user?.deliveryAddress?.phone ?? '',
  });
  const items = PRODUCTS.filter((product) => cart[product.id]);
  const total = items.reduce((sum, product) => sum + product.price * cart[product.id], 0);

  if (items.length === 0 && !confirmed) {
    return <Navigate to="/cart" replace />;
  }

  function next(message: string) {
    announce(message);
    setStep((value) => value + 1);
  }

  function placeOrder() {
    const order = createOrder({
      items: items.map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: cart[product.id],
        price: product.price,
      })),
      total,
      delivery: { ...delivery, paymentMethod: payment },
    });
    if (!order || !user) return;
    updateUser({ ...user, deliveryAddress: delivery, cart: {} });
    clearCart();
    setConfirmed(true);
    announce(`Pedido ${order.id} confirmado.`);
  }

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page">
        <h1>Proceso de compra</h1>
        <p>Paso {confirmed ? 7 : step} de 7</p>
        {confirmed ? (
          <div className="card" role="status">
            <h2>Pedido confirmado</h2>
            <p>Recibimos tu pedido. Puedes consultarlo en “Mis pedidos”.</p>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>Ver mis pedidos</button>
          </div>
        ) : (
          <div className="card">
            {step === 1 && (
              <><h2>1. Revisar el carrito</h2>{items.map((product) => <p key={product.id}>{cart[product.id]} × {product.name}</p>)}<button className="btn btn-primary" onClick={() => next('Productos revisados.')}>Continuar</button></>
            )}
            {step === 2 && (
              <><h2>2. Confirmar productos</h2><p>Confirma que los productos y cantidades son correctos.</p><button className="btn btn-primary" onClick={() => next('Productos confirmados.')}>Confirmar</button></>
            )}
            {step === 3 && (
              <><h2>3. Datos de entrega</h2>
                {(['fullName', 'address', 'city', 'phone'] as const).map((field) => (
                  <div className="field" key={field}>
                    <label htmlFor={field}>{{ fullName: 'Nombre completo', address: 'Dirección', city: 'Ciudad', phone: 'Teléfono' }[field]}</label>
                    <input id={field} value={delivery[field]} onChange={(event) => setDelivery({ ...delivery, [field]: event.target.value })} required />
                  </div>
                ))}
                <button className="btn btn-primary" disabled={!Object.values(delivery).every(Boolean)} onClick={() => next('Datos de entrega guardados.')}>Continuar</button>
              </>
            )}
            {step === 4 && (
              <><h2>4. Método de pago</h2>
                <label><input type="radio" name="payment" checked={payment === 'efectivo'} onChange={() => setPayment('efectivo')} /> Pago contra entrega</label>
                <label><input type="radio" name="payment" checked={payment === 'tarjeta-demostracion'} onChange={() => setPayment('tarjeta-demostracion')} /> Tarjeta (solo demostración)</label>
                <p>Esta tienda no procesa pagos reales ni solicita datos de tarjeta.</p>
                <button className="btn btn-primary" onClick={() => next('Método de pago seleccionado.')}>Continuar</button>
              </>
            )}
            {step >= 5 && (
              <><h2>{step === 5 ? '5. Revisar resumen' : '6. Confirmar pedido'}</h2>
                {items.map((product) => <p key={product.id}>{cart[product.id]} × {product.name} — ${(product.price * cart[product.id]).toLocaleString('es-CO')}</p>)}
                <p><strong>Total: ${total.toLocaleString('es-CO')}</strong></p>
                {step === 5
                  ? <button className="btn btn-primary" onClick={() => next('Resumen revisado.')}>Continuar</button>
                  : <button className="btn btn-primary" onClick={placeOrder}>Confirmar pedido</button>}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}

