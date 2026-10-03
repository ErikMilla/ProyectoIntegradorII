import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import VentaService from '../services/venta.service';
import { mensajeDeError } from '../services/api';
import { numeroPedido, soles, talla } from '../utils/formato';
import Icon from '../components/Icon';
import '../css/MisPedidos.css';

const fecha = (valor) => (valor
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(new Date(valor))
  : '—');

/** Historial de compras del cliente que inició sesión. */
function MisPedidos() {
  const { currentUser } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [detalles, setDetalles] = useState({});
  const [cargandoDetalle, setCargandoDetalle] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    VentaService.getHistorial(currentUser.id)
      .then((respuesta) => setPedidos(respuesta.data || []))
      .catch((errorPeticion) => setError(mensajeDeError(errorPeticion, 'No pudimos cargar tus pedidos.')))
      .finally(() => setCargando(false));
  }, [currentUser?.id]);

  const alternar = async (ventaId) => {
    if (abierto === ventaId) {
      setAbierto(null);
      return;
    }
    setAbierto(ventaId);
    if (detalles[ventaId]) return;

    setCargandoDetalle(ventaId);
    try {
      const respuesta = await VentaService.getVenta(ventaId);
      setDetalles((previo) => ({ ...previo, [ventaId]: respuesta.data.items || [] }));
    } catch {
      setDetalles((previo) => ({ ...previo, [ventaId]: [] }));
    } finally {
      setCargandoDetalle(null);
    }
  };

  return (
    <div className="container orders">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <ol>
          <li><Link to="/">Inicio</Link></li>
          <li><span aria-current="page">Mis pedidos</span></li>
        </ol>
      </nav>

      <header className="orders-head">
        <h1 className="page-title">Mis pedidos</h1>
        {!cargando && pedidos.length > 0 && (
          <p>{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</p>
        )}
      </header>

      {cargando && (
        <div className="orders-list" aria-label="Cargando pedidos" role="status">
          {[0, 1, 2].map((i) => <div key={i} className="orders-skeleton skeleton" />)}
        </div>
      )}

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="orders-empty">
          <Icon name="receipt" size={40} strokeWidth={1.25} />
          <h2>Aún no tienes pedidos</h2>
          <p>Cuando compres, aquí verás cada pedido con sus productos y la dirección de entrega.</p>
          <Link to="/catalogo" className="btn btn--primary">Ver zapatillas</Link>
        </div>
      )}

      {pedidos.length > 0 && (
        <ul className="orders-list">
          {pedidos.map((venta) => {
            const estaAbierto = abierto === venta.id;
            return (
              <li key={venta.id} className={`order${estaAbierto ? ' is-open' : ''}`}>
                <h2 className="order-heading">
                  <button
                    type="button"
                    className="order-toggle"
                    aria-expanded={estaAbierto}
                    aria-controls={`pedido-${venta.id}`}
                    onClick={() => alternar(venta.id)}
                  >
                    <span className="order-number">{numeroPedido(venta.id)}</span>
                    <span className="order-date">{fecha(venta.fecha)}</span>
                    <span className="order-channel">{venta.tipo_venta || 'Online'}</span>
                    <span className="order-total">{soles(venta.total)}</span>
                    <Icon name="chevronDown" className="order-chevron" />
                  </button>
                </h2>

                {estaAbierto && (
                  <div id={`pedido-${venta.id}`} className="order-detail">
                    {cargandoDetalle === venta.id && <p className="order-muted">Cargando detalle…</p>}
                    {detalles[venta.id]?.length > 0 && (
                      <table className="order-items">
                        <thead>
                          <tr><th scope="col">Producto</th><th scope="col">Talla</th><th scope="col">Cant.</th><th scope="col">Precio</th></tr>
                        </thead>
                        <tbody>
                          {detalles[venta.id].map((item) => (
                            <tr key={item.id}>
                              <td>{item.producto}</td>
                              <td>{talla(item.talla)}</td>
                              <td>{item.cantidad}</td>
                              <td>{soles(item.precioUnitario)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {detalles[venta.id]?.length === 0 && cargandoDetalle !== venta.id && (
                      <p className="order-muted">No encontramos el detalle de este pedido.</p>
                    )}
                    <p className="order-address"><Icon name="truck" size={18} /> {venta.direccionEnvio || 'Sin dirección registrada'}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default MisPedidos;
