import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import VentaService from '../services/venta.service';
import { mensajeDeError, resolverUrlImagen } from '../services/api';
import { soles, talla } from '../utils/formato';
import Icon from '../components/Icon';
import '../css/Checkout.css';

const COSTO_ENVIO = 17.00;
const PORCENTAJE_IGV = 0.18;

const METODOS = [
  { id: 'tarjeta', icono: 'card', label: 'Tarjeta', detalle: 'Crédito o débito' },
  { id: 'yape', icono: 'phone', label: 'Yape o Plin', detalle: 'Desde tu celular' },
];

/** "4111111111111111" -> "4111 1111 1111 1111" */
const formatearTarjeta = (valor) => valor.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

/** "1227" -> "12/27" */
const formatearVencimiento = (valor) => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

function ProcesoPago() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: currentUser ? [currentUser.nombre, currentUser.apellido].filter(Boolean).join(' ') : '',
    email: currentUser ? (currentUser.correo || '') : '',
    direccion: currentUser ? (currentUser.direccion || '') : '',
    telefono: currentUser ? (currentUser.telefono || '') : '',
  });

  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [cardData, setCardData] = useState({ numero: '', fecha: '', cvv: '' });
  const [cupon, setCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(false);
  const [mensajeCupon, setMensajeCupon] = useState('');

  const subtotal = cartTotal;
  const descuento = cuponAplicado ? subtotal * 0.10 : 0;
  const igv = (subtotal - descuento) * PORCENTAJE_IGV;
  const totalFinal = subtotal - descuento + igv + COSTO_ENVIO;

  const aplicarCupon = () => {
    const valido = cupon.trim().toUpperCase() === 'DROP10';
    setCuponAplicado(valido);
    setMensajeCupon(valido ? 'Cupón DROP10 aplicado: 10 % de descuento.' : 'Ese cupón no existe o ya venció.');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    const formateado = {
      numero: formatearTarjeta,
      fecha: formatearVencimiento,
      cvv: (v) => v.replace(/\D/g, '').slice(0, 4),
    }[name](value);
    setCardData((prev) => ({ ...prev, [name]: formateado }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser || !currentUser.id) {
      setError('Tu sesión expiró. Vuelve a iniciar sesión para pagar.');
      return;
    }

    setProcesando(true);
    setError('');

    const ventaDto = {
      usuarioId: currentUser.id,
      metodoPago,
      tipoVenta: 'Online',
      codigoDescuento: cuponAplicado ? 'DROP10' : null,
      subtotal,
      costoEnvio: COSTO_ENVIO,
      igv,
      total: totalFinal,
      cliente: {
        nombre: formData.nombre,
        email: formData.email,
        direccion: formData.direccion,
        telefono: formData.telefono,
      },
      items: cartItems.map((item) => ({
        detalleProductoId: item.varianteId,
        cantidad: item.quantity,
        precioUnitario: item.prcio_venta,
      })),
    };

    try {
      const respuesta = await VentaService.crearVenta(ventaDto);
      clearCart();
      navigate('/orden-confirmada', { state: { ventaId: respuesta.data?.id, total: totalFinal } });
    } catch (errorPeticion) {
      // El backend avisa aqui, por ejemplo, si otro cliente se llevo la
      // ultima unidad mientras este llenaba el formulario.
      setError(mensajeDeError(errorPeticion, 'No pudimos procesar el pago. Revisa los datos e inténtalo otra vez.'));
    } finally {
      setProcesando(false);
    }
  };

  // Si el carrito quedo vacio, se vuelve al carrito. Va en un efecto porque
  // navegar durante el render provoca una advertencia de React.
  useEffect(() => {
    if (cartItems.length === 0) navigate('/carrito', { replace: true });
  }, [cartItems.length, navigate]);

  if (cartItems.length === 0) return null;

  return (
    <div className="container checkout">
      <header className="checkout-head">
        <h1 className="page-title">Finalizar compra</h1>
        <Link to="/carrito" className="link">Volver al carrito</Link>
      </header>

      <form onSubmit={handleSubmit} className="checkout-layout">
        <div className="checkout-steps">
          <section className="checkout-step" aria-labelledby="paso-envio">
            <h2 id="paso-envio"><span>1</span> Datos de envío</h2>
            <div className="checkout-fields">
              <div className="field checkout-field--wide">
                <label htmlFor="nombre">Nombre completo</label>
                <input id="nombre" className="input" name="nombre" value={formData.nombre} onChange={handleInputChange} autoComplete="name" required />
              </div>
              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input id="email" className="input" type="email" name="email" value={formData.email} onChange={handleInputChange} autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="telefono">Celular</label>
                <input id="telefono" className="input" type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} autoComplete="tel" inputMode="tel" required />
              </div>
              <div className="field checkout-field--wide">
                <label htmlFor="direccion">Dirección de entrega</label>
                <input id="direccion" className="input" name="direccion" value={formData.direccion} onChange={handleInputChange} autoComplete="street-address" placeholder="Calle, número, distrito y ciudad" required />
              </div>
            </div>
          </section>

          <section className="checkout-step" aria-labelledby="paso-pago">
            <h2 id="paso-pago"><span>2</span> Pago</h2>
            <p className="notice">Esta tienda es de demostración: no se realiza ningún cobro real.</p>

            <fieldset className="pay-options">
              <legend className="visually-hidden">Método de pago</legend>
              {METODOS.map((metodo) => (
                <label key={metodo.id} className="pay-option">
                  <input
                    type="radio"
                    name="metodoPago"
                    value={metodo.id}
                    checked={metodoPago === metodo.id}
                    onChange={() => setMetodoPago(metodo.id)}
                  />
                  <Icon name={metodo.icono} size={24} />
                  <span><strong>{metodo.label}</strong>{metodo.detalle}</span>
                </label>
              ))}
            </fieldset>

            {metodoPago === 'tarjeta' ? (
              <div className="checkout-fields">
                <div className="field checkout-field--wide">
                  <label htmlFor="numero">Número de tarjeta</label>
                  <input
                    id="numero"
                    className="input"
                    name="numero"
                    value={cardData.numero}
                    onChange={handleCardChange}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    pattern="(\d{4} ){3}\d{4}"
                    title="Ingresa los 16 dígitos de la tarjeta"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="fecha">Vencimiento</label>
                  <input
                    id="fecha"
                    className="input"
                    name="fecha"
                    value={cardData.fecha}
                    onChange={handleCardChange}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    pattern="(0[1-9]|1[0-2])/\d{2}"
                    title="Mes y año, por ejemplo 08/28"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cvv">Código de seguridad</label>
                  <input
                    id="cvv"
                    className="input"
                    name="cvv"
                    value={cardData.cvv}
                    onChange={handleCardChange}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="3 o 4 dígitos"
                    pattern="\d{3,4}"
                    title="Los 3 o 4 dígitos al reverso de la tarjeta"
                    required
                  />
                </div>
              </div>
            ) : (
              <p className="checkout-yape">Al confirmar, tu pedido queda registrado como pagado con Yape o Plin.</p>
            )}
          </section>
        </div>

        <aside className="checkout-summary" aria-labelledby="resumen-title">
          <h2 id="resumen-title">Tu pedido</h2>
          <ul className="summary-lines">
            {cartItems.map((item) => (
              <li key={item.varianteId}>
                <span className="summary-thumb">
                  <img src={resolverUrlImagen(item.foto)} alt="" />
                  <span className="summary-qty">{item.quantity}</span>
                </span>
                <span className="summary-name">
                  {item.nombre}
                  <small>Talla {talla(item.talla)}</small>
                </span>
                <span>{soles(item.prcio_venta * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="checkout-coupon">
            <label htmlFor="cupon">Cupón de descuento</label>
            <div>
              <input id="cupon" className="input" value={cupon} onChange={(e) => setCupon(e.target.value)} placeholder="Ej. DROP10" />
              <button type="button" className="btn btn--outline btn--sm" onClick={aplicarCupon} disabled={!cupon.trim()}>Aplicar</button>
            </div>
            {mensajeCupon && <small className={cuponAplicado ? 'is-ok' : 'is-error'} role="status">{mensajeCupon}</small>}
          </div>

          <dl className="checkout-totals">
            <div><dt>Subtotal</dt><dd>{soles(subtotal)}</dd></div>
            {descuento > 0 && <div className="is-discount"><dt>Descuento</dt><dd>−{soles(descuento)}</dd></div>}
            <div><dt>Envío</dt><dd>{soles(COSTO_ENVIO)}</dd></div>
            <div><dt>IGV (18 %)</dt><dd>{soles(igv)}</dd></div>
            <div className="checkout-grand"><dt>Total</dt><dd>{soles(totalFinal)}</dd></div>
          </dl>

          {error && <p className="notice notice--error" role="alert">{error}</p>}

          <button type="submit" className="btn btn--red btn--block checkout-cta" disabled={procesando}>
            {procesando ? 'Procesando pago…' : `Pagar ${soles(totalFinal)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}

export default ProcesoPago;
