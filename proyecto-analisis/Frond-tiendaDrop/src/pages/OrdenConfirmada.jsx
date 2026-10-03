import { Link, useLocation } from 'react-router-dom';
import { numeroPedido, soles } from '../utils/formato';
import Icon from '../components/Icon';
import '../css/Checkout.css';

function OrdenConfirmada() {
  const location = useLocation();
  const ventaId = location.state?.ventaId;
  const total = location.state?.total;

  return (
    <div className="container order-done">
      <span className="order-done-icon"><Icon name="check" size={32} strokeWidth={2.25} /></span>
      <h1 className="page-title">Pedido confirmado</h1>
      <p>
        Gracias por tu compra{total ? ` de ${soles(total)}` : ''}. Puedes revisar el detalle y el estado en Mis pedidos.
      </p>

      {ventaId && (
        <dl className="order-done-ticket">
          <div><dt>Número de pedido</dt><dd>{numeroPedido(ventaId)}</dd></div>
          {total && <div><dt>Total pagado</dt><dd>{soles(total)}</dd></div>}
        </dl>
      )}

      <div className="order-done-actions">
        <Link to="/mis-pedidos" className="btn btn--primary">Ver mis pedidos</Link>
        <Link to="/catalogo" className="btn btn--outline">Seguir comprando</Link>
      </div>
    </div>
  );
}

export default OrdenConfirmada;
