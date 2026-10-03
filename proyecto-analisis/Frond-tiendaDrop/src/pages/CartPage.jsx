import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { resolverUrlImagen } from '../services/api';
import { soles, talla } from '../utils/formato';
import Icon from '../components/Icon';
import '../css/Checkout.css';

const COSTO_ENVIO = 17.00;
const PORCENTAJE_IGV = 0.18;

function CartPage() {
  const { cartItems, cartTotal, itemCount, removeItem, updateQuantity, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const subtotal = cartTotal;
  const igv = subtotal * PORCENTAJE_IGV;
  const totalFinal = subtotal + igv + COSTO_ENVIO;

  const handleCheckout = () => {
    navigate(currentUser ? '/proceso-pago' : '/login', {
      state: currentUser ? undefined : { destino: '/carrito' },
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="container checkout-empty">
        <Icon name="bag" size={40} strokeWidth={1.25} />
        <h1 className="page-title">Tu carrito está vacío</h1>
        <p>Cuando agregues un par lo verás aquí, con su talla y el total del pedido.</p>
        <Link to="/catalogo" className="btn btn--primary">Ver zapatillas</Link>
      </div>
    );
  }

  return (
    <div className="container checkout">
      <header className="checkout-head">
        <h1 className="page-title">Tu carrito</h1>
        <p>{itemCount} {itemCount === 1 ? 'par' : 'pares'}</p>
      </header>

      <div className="checkout-layout">
        <section aria-label="Productos en el carrito">
          <ul className="cart-lines">
            {cartItems.map((item) => (
              <li key={item.varianteId} className="cart-line">
                <Link to={`/producto/${item.id}`} className="cart-line-media" tabIndex={-1} aria-hidden="true">
                  <img src={resolverUrlImagen(item.foto)} alt="" />
                </Link>
                <div className="cart-line-info">
                  <Link to={`/producto/${item.id}`} className="cart-line-name">{item.nombre}</Link>
                  <p>Talla {talla(item.talla)} · {soles(item.prcio_venta)} c/u</p>
                  {item.quantity >= item.stock && <p className="cart-line-limit">Llegaste al stock disponible en esta talla.</p>}
                </div>
                <div className="stepper" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.varianteId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Quitar un par"
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <output aria-live="polite">{item.quantity}</output>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.varianteId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Agregar un par"
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <p className="cart-line-total">{soles(item.prcio_venta * item.quantity)}</p>
                <button
                  type="button"
                  className="cart-line-remove"
                  onClick={() => removeItem(item.varianteId)}
                  aria-label={`Quitar ${item.nombre} talla ${talla(item.talla)} del carrito`}
                >
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-actions">
            <Link to="/catalogo" className="link">Seguir comprando</Link>
            <button type="button" className="cart-clear" onClick={clearCart}>Vaciar carrito</button>
          </div>
        </section>

        <aside className="checkout-summary" aria-labelledby="resumen-title">
          <h2 id="resumen-title">Resumen</h2>
          <dl className="checkout-totals">
            <div><dt>Subtotal</dt><dd>{soles(subtotal)}</dd></div>
            <div><dt>Envío</dt><dd>{soles(COSTO_ENVIO)}</dd></div>
            <div><dt>IGV (18 %)</dt><dd>{soles(igv)}</dd></div>
            <div className="checkout-grand"><dt>Total</dt><dd>{soles(totalFinal)}</dd></div>
          </dl>
          <button type="button" className="btn btn--red btn--block checkout-cta" onClick={handleCheckout}>
            {currentUser ? 'Ir a pagar' : 'Inicia sesión para pagar'}
          </button>
          <p className="checkout-secure"><Icon name="shield" size={18} /> Pago seguro con tarjeta, Yape o Plin</p>
        </aside>
      </div>
    </div>
  );
}

export default CartPage;
