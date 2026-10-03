import { useEffect, useMemo, useState } from 'react';
import InventoryService from '../../services/inventory.service';
import UserService from '../../services/user.service';
import VentaService from '../../services/venta.service';
import { agruparPorProducto } from '../../utils/productGrouping';
import { mensajeDeError } from '../../services/api';

const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;
const fechaCorta = (valor) => (valor ? new Date(valor).toLocaleDateString('es-PE') : '—');

const STOCK_CRITICO = 5;

/**
 * Reportes para la toma de decisiones del administrador.
 *
 * Estos tres reportes ya estaban escritos pero no se mostraban en ninguna
 * pantalla: no estaban importados en ningun sitio. Aqui se unifican en un solo
 * modulo con pestanas y con los mismos estilos del resto del panel.
 */
function Reportes() {
  const [pestana, setPestana] = useState('ventas');
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resVentas, resProductos, resClientes, resResumen] = await Promise.all([
          VentaService.getAllVentas(),
          InventoryService.getAllProductos(),
          UserService.getClientes(),
          VentaService.getResumenReportes(),
        ]);
        setVentas(resVentas.data || []);
        setProductos(agruparPorProducto(resProductos.data));
        setClientes(resClientes.data || []);
        setResumen(resResumen.data || {});
      } catch (error) {
        setMensaje(mensajeDeError(error, 'No se pudieron cargar los reportes.'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const ingresos = useMemo(
    () => ventas.reduce((suma, venta) => suma + Number(venta.total || 0), 0),
    [ventas],
  );

  /** Valor del inventario a precio de costo: lo que la tienda tiene inmovilizado. */
  const valorInventario = useMemo(() => productos.reduce((total, producto) => {
    const stock = producto.variantes.reduce((suma, v) => suma + Number(v.stock || 0), 0);
    return total + stock * Number(producto.precio_compra || 0);
  }, 0), [productos]);

  /** Cuantos pedidos y cuanto compro cada cliente. */
  const comprasPorCliente = useMemo(() => ventas.reduce((acumulado, venta) => {
    const id = venta.usuario?.id;
    if (!id) return acumulado;
    const actual = acumulado[id] || { pedidos: 0, total: 0 };
    acumulado[id] = { pedidos: actual.pedidos + 1, total: actual.total + Number(venta.total || 0) };
    return acumulado;
  }, {}), [ventas]);

  if (cargando) {
    return (
      <section className="admin-module">
        <header className="module-header"><div><h1>Reportes</h1></div></header>
        <div className="empty-state">Cargando reportes…</div>
      </section>
    );
  }

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Reportes</h1>
        </div>
      </header>

      <nav className="section-tabs" aria-label="Tipos de reporte">
        <button className={pestana === 'ventas' ? 'active' : ''} onClick={() => setPestana('ventas')}>Ventas</button>
        <button className={pestana === 'inventario' ? 'active' : ''} onClick={() => setPestana('inventario')}>Inventario</button>
        <button className={pestana === 'clientes' ? 'active' : ''} onClick={() => setPestana('clientes')}>Clientes</button>
      </nav>

      {mensaje && <div className="admin-notice" role="status">{mensaje}</div>}

      {pestana === 'ventas' && (
        <>
          <div className="dashboard-metrics">
            <article><span>Ingresos totales</span><strong>{soles(ingresos)}</strong><small>{ventas.length} ventas</small></article>
            <article><span>Ganancia estimada</span><strong>{soles(resumen?.gananciaEstimada)}</strong><small>Después de costo y descuentos</small></article>
            <article>
              <span>Ticket promedio</span>
              <strong>{soles(ventas.length ? ingresos / ventas.length : 0)}</strong>
              <small>Por venta registrada</small>
            </article>
            <article>
              <span>Ventas online</span>
              <strong>{ventas.filter((v) => v.tipo_venta === 'Online').length}</strong>
              <small>{ventas.filter((v) => v.tipo_venta === 'Presencial').length} presenciales</small>
            </article>
          </div>

          <div className="data-card">
            <header className="card-heading"><h2>Productos más vendidos</h2></header>
            {(resumen?.productosMasVendidos || []).length === 0 ? (
              <div className="empty-state">Aún no hay productos vendidos.</div>
            ) : (
              <ul className="brand-chart">
                {resumen.productosMasVendidos.map((producto) => (
                  <li key={producto.productoId}>
                    <span className="brand-chart-label">{producto.nombre}</span>
                    <span className="brand-chart-track"><span className="brand-chart-bar" style={{ width: `${(Number(producto.unidades) / Number(resumen.productosMasVendidos[0].unidades)) * 100}%` }} /></span>
                    <span className="brand-chart-value">{producto.unidades} u.</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="data-card">
            {ventas.length === 0 ? (
              <div className="empty-state"><strong>Aún no hay ventas</strong><span>Registra la primera en Punto de venta o en la tienda.</span></div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>N.º</th><th>Fecha</th><th>Cliente</th><th>Canal</th>
                      <th>Método</th><th>Subtotal</th><th>IGV</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta) => (
                      <tr key={venta.id}>
                        <td>F-{String(venta.id).padStart(5, '0')}</td>
                        <td>{fechaCorta(venta.fecha)}</td>
                        <td>{venta.usuario ? `${venta.usuario.nombre} ${venta.usuario.apellido}` : '—'}</td>
                        <td><span className="status-pill">{venta.tipo_venta || 'Online'}</span></td>
                        <td>{venta.metodo_pago || '—'}</td>
                        <td>{soles(venta.subtotal)}</td>
                        <td>{soles(venta.igv)}</td>
                        <td><strong>{soles(venta.total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {pestana === 'inventario' && (
        <>
          <div className="dashboard-metrics">
            <article>
              <span>Valorización (costo)</span>
              <strong>{soles(valorInventario)}</strong>
              <small>Capital inmovilizado</small>
            </article>
            <article><span>Modelos</span><strong>{productos.length}</strong><small>Productos distintos</small></article>
            <article>
              <span>Unidades en stock</span>
              <strong>
                {productos.reduce((s, p) => s + p.variantes.reduce((a, v) => a + Number(v.stock || 0), 0), 0)}
              </strong>
              <small>Sumando todas las tallas</small>
            </article>
          </div>

          <div className="data-card">
            {productos.length === 0 ? (
              <div className="empty-state"><strong>No hay productos</strong><span>Registra el primero en Inventario.</span></div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Producto</th><th>Modelo</th><th>Costo</th>
                      <th>P. venta</th><th>Margen</th><th>Stock</th><th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => {
                      const stock = producto.variantes.reduce((suma, v) => suma + Number(v.stock || 0), 0);
                      const costo = Number(producto.precio_compra || 0);
                      const venta = Number(producto.prcio_venta || 0);
                      const margen = venta > 0 ? ((venta - costo) / venta) * 100 : 0;
                      return (
                        <tr key={producto.id}>
                          <td><strong>{producto.nombre}</strong></td>
                          <td>{producto.modelo || '—'}</td>
                          <td>{soles(costo)}</td>
                          <td>{soles(venta)}</td>
                          <td>{margen.toFixed(0)}%</td>
                          <td><strong>{stock}</strong></td>
                          <td>
                            <span className="status-pill">
                              {stock <= STOCK_CRITICO ? 'Stock bajo' : 'Disponible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {pestana === 'clientes' && (
        <div className="data-card">
          <header className="card-heading">
            <h2>Cartera de clientes</h2>
            <span>{clientes.length} registrados</span>
          </header>

          {clientes.length === 0 ? (
            <div className="empty-state"><strong>No hay clientes</strong><span>Créalos en el módulo Clientes.</span></div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th><th>DNI</th><th>Correo</th>
                    <th>Teléfono</th><th>Registro</th><th>Pedidos</th><th>Total comprado</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td><strong>{cliente.nombre} {cliente.apellido}</strong></td>
                      <td>{cliente.dni || '—'}</td>
                      <td>{cliente.correo}</td>
                      <td>{cliente.telefono || '—'}</td>
                      <td>{fechaCorta(cliente.fechacreacion)}</td>
                      <td>{comprasPorCliente[cliente.id]?.pedidos || 0}</td>
                      <td><strong>{soles(comprasPorCliente[cliente.id]?.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Reportes;
