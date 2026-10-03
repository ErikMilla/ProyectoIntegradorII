import { useEffect, useMemo, useState } from 'react';
import InventoryService from '../../services/inventory.service';
import UserService from '../../services/user.service';
import VentaService from '../../services/venta.service';
import { mensajeDeError } from '../../services/api';

const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;

/** Una variante con 5 o menos unidades se considera stock bajo. */
const UMBRAL_STOCK_BAJO = 5;

/**
 * Pantalla de inicio del administrador: los numeros del negocio en vivo,
 * leidos directamente de la base de datos.
 */
function DashboardOverview({ onNavigate }) {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [unidadesPorMarca, setUnidadesPorMarca] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      VentaService.getAllVentas(),
      UserService.getClientes(),
      InventoryService.getAllProductos(),
      VentaService.getResumenReportes(),
    ])
      .then(([resVentas, resClientes, resVariantes, resResumen]) => {
        setVentas(resVentas.data || []);
        setClientes(resClientes.data || []);
        setVariantes(resVariantes.data || []);
        setResumen(resResumen.data || {});
        setUnidadesPorMarca((resResumen.data?.productosMasVendidos || []).map((producto) => ({
          marca: producto.nombre,
          unidades: Number(producto.unidades || 0),
        })));
      })
      .catch((errorPeticion) => setError(mensajeDeError(errorPeticion, 'No se pudieron cargar los indicadores.')))
      .finally(() => setCargando(false));
  }, []);

  const ingresos = useMemo(
    () => ventas.reduce((suma, venta) => suma + Number(venta.total || 0), 0),
    [ventas],
  );

  const unidadesEnStock = useMemo(
    () => variantes.reduce((suma, variante) => suma + Number(variante.stock || 0), 0),
    [variantes],
  );

  const stockBajo = useMemo(
    () => variantes.filter((variante) => variante.stock <= UMBRAL_STOCK_BAJO),
    [variantes],
  );

  const ventasRecientes = useMemo(() => ventas.slice(0, 5), [ventas]);

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Resumen</h1>
        </div>
        <button className="primary-button" onClick={() => onNavigate('pos')}>Nueva venta</button>
      </header>

      {error && <div className="admin-notice" role="alert">{error}</div>}

      {cargando ? (
        <div className="empty-state">Cargando indicadores…</div>
      ) : (
        <>
          <div className="dashboard-metrics">
            <article>
              <span>Ingresos</span>
              <strong>{soles(ingresos)}</strong>
              <small>{ventas.length} ventas registradas</small>
            </article>
            <article>
              <span>Ganancia estimada</span>
              <strong>{soles(resumen?.gananciaEstimada)}</strong>
              <small>{clientes.length} clientes registrados</small>
            </article>
            <article>
              <span>Stock disponible</span>
              <strong>{unidadesEnStock}</strong>
              <small>{variantes.length} variantes de talla</small>
            </article>
            <article className={stockBajo.length ? 'warning-metric' : ''}>
              <span>Stock bajo</span>
              <strong>{stockBajo.length}</strong>
              <small>Con {UMBRAL_STOCK_BAJO} unidades o menos</small>
            </article>
          </div>

          <div className="dashboard-content">
            <div className="data-card">
              <header className="card-heading">
                <h2>Ventas recientes</h2>
                <button className="text-button" onClick={() => onNavigate('facturacion')}>Ver facturas</button>
              </header>

              {ventasRecientes.length === 0 ? (
                <div className="empty-state">
                  <strong>Aún no hay ventas</strong>
                  <span>Registra la primera desde Punto de venta.</span>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Venta</th><th>Cliente</th><th>Fecha</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {ventasRecientes.map((venta) => (
                      <tr key={venta.id}>
                        <td>F-{String(venta.id).padStart(5, '0')}</td>
                        <td>{venta.usuario?.nombre} {venta.usuario?.apellido}</td>
                        <td>{new Date(venta.fecha).toLocaleDateString('es-PE')}</td>
                        <td><strong>{soles(venta.total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="data-card">
              <header className="card-heading">
                <h2>Productos más vendidos</h2>
              </header>

              {unidadesPorMarca.length === 0 ? (
                <div className="empty-state">
                  <strong>Aún no hay datos</strong>
                  <span>Aparecerá apenas se registre una venta.</span>
                </div>
              ) : (
                <ul className="brand-chart">
                  {unidadesPorMarca.map((fila) => (
                    <li key={fila.marca}>
                      <span className="brand-chart-label">{fila.marca}</span>
                      <span className="brand-chart-track">
                        <span
                          className="brand-chart-bar"
                          style={{ width: `${(fila.unidades / unidadesPorMarca[0].unidades) * 100}%` }}
                        />
                      </span>
                      <span className="brand-chart-value">{fila.unidades} u.</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="data-card">
              <header className="card-heading">
                <h2>Atención de inventario</h2>
                <button className="text-button" onClick={() => onNavigate('inventario')}>Gestionar</button>
              </header>

              {stockBajo.length === 0 ? (
                <div className="empty-state">
                  <strong>Sin alertas</strong>
                  <span>El stock está saludable.</span>
                </div>
              ) : (
                <ul className="alert-list">
                  {stockBajo.slice(0, 6).map((variante) => (
                    <li key={variante.id}>
                      <span>
                        <strong>{variante.producto?.nombre}</strong>
                        <small>Talla {variante.talla}</small>
                      </span>
                      <b>{variante.stock} u.</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default DashboardOverview;
