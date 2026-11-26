import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormField } from '../../shared/FormField';
import { SkipLink } from '../../shared/SkipLink';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { useShop } from '../../app/ShopContext';
import { cartLines, formatPrice } from '../../services/catalog';
import { catalogKindForUser, needsForUser } from '../../services/identity';
import { getCheckoutAdaptation } from './profileAdaptations';
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
  address:  'Dirección de entrega',
  city:     'Ciudad',
  phone:    'Teléfono de contacto',
};

const DELIVERY_EXAMPLES: Record<keyof Delivery, string> = {
  fullName: 'Ejemplo: María García López',
  address:  'Ejemplo: Av. 6 de Diciembre 123',
  city:     'Ejemplo: Quito',
  phone:    'Ejemplo: 0987654321',
};

const DELIVERY_AUTOCOMPLETE: Record<keyof Delivery, string> = {
  fullName: 'name',
  address:  'street-address',
  city:     'address-level2',
  phone:    'tel',
};

export function CheckoutPage() {
  const { cart, createOrder, subtotal, cartCount } = useShop();
  const { user, updateUser } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();
  const stepTitleRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep]           = useState(1);
  const [order, setOrder]         = useState<Order | null>(null);
  const [accepted, setAccepted]   = useState(false);
  const [message, setMessage]     = useState('');
  const [payment, setPayment]     = useState<'efectivo' | 'tarjeta-demostracion'>('efectivo');
  const [delivery, setDelivery]   = useState<Delivery>({
    fullName: user?.deliveryAddress?.fullName ?? user?.name ?? '',
    address:  user?.deliveryAddress?.address ?? '',
    city:     user?.deliveryAddress?.city    ?? '',
    phone:    user?.deliveryAddress?.phone   ?? '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof Delivery, string>>>({});

  const lines   = cartLines(cart);
  const kind    = catalogKindForUser(user);
  const needs   = needsForUser(user);
  const adapt   = getCheckoutAdaptation(needs, user?.disabilityLevels);

  if (lines.length === 0 && !order) return <Navigate to="/cart" replace />;

  const go = (next: number, text: string) => {
    setStep(next);
    setMessage(text);
    announce(`Paso ${next} de 7. ${text}`);
  };

  // Mueve el foco al título del paso cuando corresponde (WCAG 2.4.3)
  useEffect(() => {
    if (adapt.moveFocusOnStep) stepTitleRef.current?.focus();
  }, [step, adapt.moveFocusOnStep]);

  const submitDelivery = (event: FormEvent) => {
    event.preventDefault();
    const errors: Partial<Record<keyof Delivery, string>> = {};
    if (delivery.fullName.trim().length < 3) errors.fullName = 'Escribe tu nombre completo (mínimo 3 caracteres).';
    if (delivery.address.trim().length < 5)  errors.address  = 'Escribe una dirección válida (calle y número).';
    if (!delivery.city.trim())               errors.city     = 'Escribe el nombre de tu ciudad.';
    if (!/^\+?[\d\s-]{7,}$/.test(delivery.phone.trim())) errors.phone = 'Escribe un teléfono válido (mínimo 7 dígitos).';
    setDeliveryErrors(errors);
    if (Object.keys(errors).length) {
      announce('Hay campos con error. Revísalos antes de continuar.');
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
      total:    subtotal,
      delivery: { ...delivery, paymentMethod: payment },
    });
    if (!created) {
      setMessage('No se pudo crear el pedido. Vuelve a revisar tu carrito.');
      announce('No se pudo crear el pedido.');
      return;
    }
    updateUser({ ...user, deliveryAddress: delivery, cart: {}, orders: [created.id, ...(user.orders ?? [])] });
    setOrder(created);
    setStep(7);
    announce(`Pedido ${created.id} confirmado. Puedes consultarlo en Mis pedidos.`);
  };

  /* ── estilos según adaptaciones ── */
  const btnCls    = `btn btn-primary${adapt.largeTargets ? ' btn-xl' : ''}`;
  const ghostCls  = `btn btn-ghost${adapt.largeTargets  ? ' btn-xl' : ''}`;
  const spacingStyle = adapt.extraSpacing ? { gap: '1.5rem' } : {};

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page checkout-page" tabIndex={-1}>
        <h1>Finalizar compra</h1>

        {/* Indicador de paso prominente para modo cognitivo */}
        <p
          className="step-indicator"
          aria-live="polite"
          style={adapt.stepCounter ? { fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' } : {}}
        >
          Paso {step} de 7 · {STEPS[step - 1]}
        </p>

        <ol className="step-list" aria-label="Progreso de la compra">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={step === index + 1 ? 'step' : undefined}
              className={step >= index + 1 ? 'done' : ''}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        {message && (
          <p className="feedback feedback-ok" role={adapt.visualOnly ? 'alert' : 'status'}>
            <span aria-hidden="true">✓</span> {message}
          </p>
        )}

        {step === 7 && order ? (
          <section className="card stack" role="status" aria-labelledby="order-confirmed">
            <h2 id="order-confirmed">Pedido confirmado</h2>
            <p><strong>Número de pedido:</strong> {order.id}</p>
            <p><strong>Total:</strong> {formatPrice(order.total)}</p>
            <p><strong>Estado:</strong> {order.status}</p>
            <p>Entrega para {order.delivery.fullName} en {order.delivery.address}, {order.delivery.city}.</p>
            <p className="muted">Esta es una demostración: no se realizó ningún cobro.</p>
            <div className="actions" style={spacingStyle}>
              <button className={btnCls} onClick={() => navigate('/orders')}>Ver mis pedidos</button>
              <Link className={`btn btn-secondary${adapt.largeTargets ? ' btn-xl' : ''}`} to={`/catalog/${kind}`}>Seguir comprando</Link>
            </div>
          </section>
        ) : (
          <section className="card stack" aria-labelledby="checkout-step-title">
            <h2
              id="checkout-step-title"
              ref={stepTitleRef}
              tabIndex={adapt.moveFocusOnStep ? -1 : undefined}
              style={{ outline: 'none' }}
            >
              {STEPS[step - 1]}
            </h2>

            {/* Instrucciones de paso para auditiva/cognitiva/motriz */}
            {adapt.stepInstructions && (
              <StepInstruction step={step} />
            )}

            {step === 1 && (
              <>
                {adapt.simpleMode && <p><strong>Revisa lo que vas a comprar.</strong> Si está bien, pulsa Continuar.</p>}
                {!adapt.simpleMode && <p>Revisa los productos de tu carrito.</p>}
                <ul>
                  {lines.map(({ product, quantity, subtotal: ls }) => (
                    <li key={product.id}>{quantity} × {product.name} — {formatPrice(ls)}</li>
                  ))}
                </ul>
                <div className="actions" style={spacingStyle}>
                  <button className={btnCls} onClick={() => go(2, 'Productos revisados.')}>Continuar</button>
                  <Link className={ghostCls} to="/cart">Volver al carrito</Link>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {adapt.simpleMode
                  ? <p><strong>¿Cuántos quieres de cada producto?</strong> Si las cantidades están bien, pulsa Confirmar.</p>
                  : <p>Confirma las cantidades. Puedes volver al carrito si necesitas cambiarlas.</p>}
                <ul>
                  {lines.map(({ product, quantity }) => (
                    <li key={product.id}>{product.name}: {quantity} unidad{quantity === 1 ? '' : 'es'}</li>
                  ))}
                </ul>
                <div className="actions" style={spacingStyle}>
                  <button className={btnCls} onClick={() => go(3, 'Cantidades confirmadas.')}>Confirmar cantidades</button>
                  <button className={ghostCls} onClick={() => go(1, 'Volviendo a revisar.')}>Volver</button>
                </div>
              </>
            )}

            {step === 3 && (
              <form noValidate onSubmit={submitDelivery} className="stack">
                {adapt.simpleMode
                  ? <p><strong>¿A dónde te lo enviamos?</strong> Escribe tu dirección. Los campos con * son obligatorios.</p>
                  : <p>Escribe los datos de entrega. Los campos con * son obligatorios.</p>}
                {(Object.keys(DELIVERY_LABELS) as (keyof Delivery)[]).map((field) => (
                  <FormField
                    key={field}
                    label={`${DELIVERY_LABELS[field]} *`}
                    required
                    type={field === 'phone' ? 'tel' : 'text'}
                    autoComplete={DELIVERY_AUTOCOMPLETE[field]}
                    value={delivery[field]}
                    error={deliveryErrors[field]}
                    hint={adapt.fieldExamples ? DELIVERY_EXAMPLES[field] : undefined}
                    onChange={(e) => setDelivery({ ...delivery, [field]: e.target.value })}
                    style={adapt.largeTargets ? { minHeight: '56px' } : undefined}
                  />
                ))}
                <div className="actions" style={spacingStyle}>
                  <button className={btnCls} type="submit">Continuar al pago</button>
                  <button className={ghostCls} type="button" onClick={() => go(2, 'Volviendo a cantidades.')}>Volver</button>
                </div>
              </form>
            )}

            {step === 4 && (
              <>
                <div className="demo-banner" role="note">
                  <strong>Modo demostración.</strong> No se solicitan datos de tarjeta ni se realiza ningún cobro.
                </div>
                {adapt.visualOnly && (
                  <p className="visual-notice" role="note">
                    <span aria-hidden="true">ℹ️</span> Selecciona tu forma de pago usando las teclas ↑ ↓ y pulsa Espacio.
                  </p>
                )}
                <fieldset className="choice-group">
                  <legend>Elige un método de pago disponible</legend>
                  <label className="choice" style={adapt.largeTargets ? { minHeight: 56 } : {}}>
                    <input type="radio" name="payment" value="efectivo"
                      checked={payment === 'efectivo'} onChange={() => setPayment('efectivo')} />
                    <span>Pago contra entrega (efectivo)</span>
                  </label>
                  <label className="choice" style={adapt.largeTargets ? { minHeight: 56 } : {}}>
                    <input type="radio" name="payment" value="tarjeta-demostracion"
                      checked={payment === 'tarjeta-demostracion'} onChange={() => setPayment('tarjeta-demostracion')} />
                    <span>Tarjeta de demostración (sin cobro real)</span>
                  </label>
                </fieldset>
                <div className="actions" style={spacingStyle}>
                  <button className={btnCls} onClick={() => go(5, 'Método de pago seleccionado.')}>Revisar resumen</button>
                  <button className={ghostCls} onClick={() => go(3, 'Volviendo a entrega.')}>Volver</button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                {adapt.announceStepSummary && (
                  <p role="status" className="sr-only">
                    Resumen: {cartCount} productos, total {formatPrice(subtotal)}, entrega a {delivery.city}.
                  </p>
                )}
                <dl className="summary-list">
                  <div><dt>Productos</dt><dd>{cartCount} unidades</dd></div>
                  <div><dt>Entrega</dt><dd>{delivery.fullName} · {delivery.address}, {delivery.city}</dd></div>
                  <div><dt>Teléfono</dt><dd>{delivery.phone}</dd></div>
                  <div><dt>Pago</dt><dd>{payment === 'efectivo' ? 'Contra entrega' : 'Tarjeta de demostración'}</dd></div>
                  <div><dt>Total</dt><dd><strong>{formatPrice(subtotal)}</strong></dd></div>
                </dl>
                <div className="actions" style={spacingStyle}>
                  <button className={btnCls} onClick={() => go(6, 'Revisa y confirma tu pedido.')}>Continuar</button>
                  <button className={ghostCls} onClick={() => go(4, 'Volviendo al pago.')}>Volver</button>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                {adapt.simpleMode ? (
                  <>
                    <p><strong>Último paso.</strong> Vas a pedir {cartCount} producto{cartCount === 1 ? '' : 's'} por <strong>{formatPrice(subtotal)}</strong>.</p>
                    <p>No se hace ningún cobro real. Puedes cancelar cuando quieras.</p>
                  </>
                ) : (
                  <>
                    <p>Estás por confirmar {cartCount} producto{cartCount === 1 ? '' : 's'} por {formatPrice(subtotal)}.</p>
                    <p><strong>No se realiza ningún cobro.</strong> Tu pedido quedará guardado en Mis pedidos.</p>
                  </>
                )}
                <div className="consent-box">
                  <input id="order-confirm" type="checkbox"
                    checked={accepted} onChange={e => setAccepted(e.target.checked)} />
                  <label htmlFor="order-confirm">
                    {adapt.simpleMode
                      ? 'Sí quiero hacer este pedido.'
                      : 'Confirmo expresamente que quiero realizar este pedido.'}
                  </label>
                </div>
                <div className="actions" style={spacingStyle}>
                  <button className={btnCls} disabled={!accepted} onClick={confirmOrder}>Confirmar pedido</button>
                  <button className={ghostCls} onClick={() => go(5, 'Volviendo al resumen.')}>Volver</button>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function StepInstruction({ step }: { step: number }) {
  const instructions: Record<number, string> = {
    1: 'Revisa la lista de productos. Si necesitas cambiar cantidades, pulsa "Volver al carrito".',
    2: 'Verifica cuántas unidades quieres de cada producto.',
    3: 'Escribe los datos donde quieres recibir tu pedido. Todos los campos con * son obligatorios.',
    4: 'Elige cómo quieres pagar. Ninguna opción realiza un cobro real.',
    5: 'Revisa el resumen de tu pedido antes de confirmar. Si algo está mal, pulsa Volver.',
    6: 'Marca la casilla y pulsa "Confirmar pedido" para finalizar.',
  };
  const text = instructions[step];
  if (!text) return null;
  return (
    <p className="step-instruction" role="note" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
      <span aria-hidden="true">ℹ️ </span>{text}
    </p>
  );
}
