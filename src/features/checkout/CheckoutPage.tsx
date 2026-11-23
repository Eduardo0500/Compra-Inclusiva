import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { useShop } from '../../app/ShopContext';
import { cartLines, formatPrice } from '../../services/catalog';
import { catalogKindForUser } from '../../services/identity';
import type { Order } from '../../types/catalog';

const STEPS = [
  'Revisar carrito',
  'Confirmar cantidades',
  'Datos de entrega',
  'Método de pago',
  'Revisar resumen',
  'Confirmar pedido',
  'Confirmación',
] as const;

type Delivery = {
  fullName: string;
  address: string;
  city: string;
  phone: string;
};

const DELIVERY_LABELS: Record<keyof Delivery, string> = {
  fullName: 'Nombre completo',
  address: 'Dirección de entrega',
  city: 'Ciudad',
  phone: 'Teléfono de contacto',
};

export function CheckoutPage() {
  const { cart, createOrder, subtotal, cartCount } = useShop();
  const { user, updateUser } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState<Order | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState<'efectivo' | 'tarjeta-demostracion'>('efectivo');
  const [delivery, setDelivery] = useState<Delivery>({
    fullName: user?.deliveryAddress?.fullName ?? user?.name ?? '',
    address: user?.deliveryAddress?.address ?? '',
    city: user?.deliveryAddress?.city ?? '',
    phone: user?.deliveryAddress?.phone ?? '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof Delivery, string>>>({});

  const lines = cartLines(cart);
  const kind = catalogKindForUser(user);

  if (lines.length === 0 && !order) return <Navigate to="/cart" replace />;

  const go = (next: number, text: string) => {
    setStep(next);
    setMessage(text);
    announce(`Paso ${next} de 7. ${text}`);
  };

  const submitDelivery = (event: FormEvent) => {
    event.preventDefault();
    const errors: Partial<Record<keyof Delivery, string>> = {};
    if (delivery.fullName.trim().length < 3) errors.fullName = 'Escribe tu nombre completo.';
    if (delivery.address.trim().length < 5) errors.address = 'Escribe una dirección válida.';
    if (!delivery.city.trim()) errors.city = 'Escribe la ciudad.';
    if (!/^\+?[\d\s-]{7,}$/.test(delivery.phone.trim())) errors.phone = 'Escribe un teléfono válido (mínimo 7 dígitos).';
    setDeliveryErrors(errors);
    if (Object.keys(errors).length) {
      announce('Revisa los campos marcados con error.');
      return;
    }
    go(4, 'Datos de entrega guardados.');
  };

  const confirmOrder = () => {
    if (!accepted || !user) return;
    const created = createOrder({
      items: lines.map(({ product, quantity }) => ({
        productId: product.id, name: product.name, quantity, price: product.price,
      })),
      total: subtotal,
      delivery: { ...delivery, paymentMethod: payment },
    });
    if (!created) {
      setMessage('No se pudo crear el pedido. Vuelve a revisar tu carrito.');
      announce('No se pudo crear el pedido.');
      return;
    }
    updateUser({
      ...user,
      deliveryAddress: delivery,
      cart: {},
      orders: [created.id, ...(user.orders ?? [])],
    });
    setOrder(created);
    setStep(7);
    setMessage(`Pedido ${created.id} confirmado.`);
    announce(`Pedido ${created.id} confirmado. Puedes consultarlo en Mis pedidos.`);
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page checkout-page" tabIndex={-1}>
        <h1>Finalizar compra</h1>
        <p className="step-indicator" aria-live="polite">Paso {step} de 7 · {STEPS[step - 1]}</p>
        <ol className="step-list" aria-label="Progreso de la compra">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={step === index + 1 ? 'step' : undefined}
              className={step >= index + 1 ? 'done' : ''}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        {message && <p className="feedback feedback-ok" role="status"><span aria-hidden="true">✓</span> {message}</p>}

        {step === 7 && order ? (
          <section className="card stack" role="status" aria-labelledby="order-confirmed">
            <h2 id="order-confirmed">Pedido confirmado</h2>
            <p><strong>Número de pedido:</strong> {order.id}</p>
            <p><strong>Total:</strong> {formatPrice(order.total)}</p>
            <p><strong>Estado:</strong> {order.status}</p>
            <p>Entrega para {order.delivery.fullName} en {order.delivery.address}, {order.delivery.city}.</p>
            <p className="muted">Esta es una demostración: no se realizó ningún cobro.</p>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => navigate('/orders')}>Ver mis pedidos</button>
              <Link className="btn btn-secondary" to={`/catalog/${kind}`}>Seguir comprando</Link>
            </div>
          </section>
        ) : (
          <section className="card stack" aria-labelledby="checkout-step-title">
            <h2 id="checkout-step-title">{STEPS[step - 1]}</h2>

            {step === 1 && (
              <>
                <p>Revisa los productos de tu carrito.</p>
                <ul>
                  {lines.map(({ product, quantity, subtotal: lineSubtotal }) => (
                    <li key={product.id}>{quantity} × {product.name} — {formatPrice(lineSubtotal)}</li>
                  ))}
                </ul>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => go(2, 'Productos revisados.')}>Continuar</button>
                  <Link className="btn btn-ghost" to="/cart">Volver al carrito</Link>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p>Confirma las cantidades. Puedes volver al carrito si necesitas cambiarlas.</p>
                <ul>
                  {lines.map(({ product, quantity }) => (
                    <li key={product.id}>{product.name}: {quantity} unidad{quantity === 1 ? '' : 'es'}</li>
                  ))}
                </ul>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => go(3, 'Cantidades confirmadas.')}>Confirmar cantidades</button>
                  <button className="btn btn-ghost" onClick={() => go(1, 'Volviendo al carrito.')}>Volver</button>
                </div>
              </>
            )}

            {step === 3 && (
              <form noValidate onSubmit={submitDelivery} className="stack">
                <p>Escribe los datos de entrega. Los campos con * son obligatorios.</p>
                {(Object.keys(DELIVERY_LABELS) as (keyof Delivery)[]).map((field) => (
                  <FormField key={field} label={`${DELIVERY_LABELS[field]} *`} required
                    type={field === 'phone' ? 'tel' : 'text'}
                    autoComplete={field === 'fullName' ? 'name'
                      : field === 'address' ? 'street-address'
                        : field === 'city' ? 'address-level2' : 'tel'}
                    value={delivery[field]} error={deliveryErrors[field]}
                    onChange={(event) => setDelivery({ ...delivery, [field]: event.target.value })} />
                ))}
                <div className="actions">
                  <button className="btn btn-primary" type="submit">Continuar al pago</button>
                  <button className="btn btn-ghost" type="button" onClick={() => go(2, 'Volviendo a cantidades.')}>Volver</button>
                </div>
              </form>
            )}

            {step === 4 && (
              <>
                <div className="demo-banner" role="note">
                  <strong>Modo demostración.</strong> No se solicitan datos de tarjeta ni se realiza ningún cobro.
                </div>
                <fieldset className="choice-group">
                  <legend>Elige un método de pago disponible</legend>
                  <label className="choice">
                    <input type="radio" name="payment" value="efectivo" checked={payment === 'efectivo'}
                      onChange={() => setPayment('efectivo')} />
                    <span>Pago contra entrega (efectivo)</span>
                  </label>
                  <label className="choice">
                    <input type="radio" name="payment" value="tarjeta-demostracion"
                      checked={payment === 'tarjeta-demostracion'}
                      onChange={() => setPayment('tarjeta-demostracion')} />
                    <span>Tarjeta de demostración (sin cobro real)</span>
                  </label>
                </fieldset>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => go(5, 'Método de pago seleccionado.')}>Revisar resumen</button>
                  <button className="btn btn-ghost" onClick={() => go(3, 'Volviendo a entrega.')}>Volver</button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <dl className="summary-list">
                  <div><dt>Productos</dt><dd>{cartCount} unidades</dd></div>
                  <div><dt>Entrega</dt><dd>{delivery.fullName} · {delivery.address}, {delivery.city}</dd></div>
                  <div><dt>Teléfono</dt><dd>{delivery.phone}</dd></div>
                  <div><dt>Pago</dt><dd>{payment === 'efectivo' ? 'Contra entrega' : 'Tarjeta de demostración'}</dd></div>
                  <div><dt>Total</dt><dd><strong>{formatPrice(subtotal)}</strong></dd></div>
                </dl>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => go(6, 'Revisa y confirma tu pedido.')}>Continuar</button>
                  <button className="btn btn-ghost" onClick={() => go(4, 'Volviendo al pago.')}>Volver</button>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <p>Estás por confirmar {cartCount} producto{cartCount === 1 ? '' : 's'} por {formatPrice(subtotal)}.</p>
                <p><strong>No se realiza ningún cobro.</strong> Tu pedido quedará guardado en Mis pedidos.</p>
                <div className="consent-box">
                  <input id="order-confirm" type="checkbox" checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)} />
                  <label htmlFor="order-confirm">Confirmo expresamente que quiero realizar este pedido.</label>
                </div>
                <div className="actions">
                  <button className="btn btn-primary" disabled={!accepted} onClick={confirmOrder}>Confirmar pedido</button>
                  <button className="btn btn-ghost" onClick={() => go(5, 'Volviendo al resumen.')}>Volver</button>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}
