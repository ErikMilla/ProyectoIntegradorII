import { useCallback, useEffect, useState } from 'react';
import VentaService from '../../services/venta.service';
import { mensajeDeError } from '../../services/api';

const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;
const fechaHora = (valor) => (valor
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(valor))
  : '—');

/**
 * Facturacion: listado de comprobantes generados por cada venta.
 *
 * Anular una venta no solo borra el comprobante: el backend devuelve al
 * inventario las unidades que se habian descontado.
 */
function InvoiceManagement({ onCreateSale }) {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [mostrarIgv, setMostrarIgv] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await VentaService.buscarVentas({ page: pagina, size: 20, q: busqueda, desde: fechaDesde, hasta: fechaHasta });
      setVentas(respuesta.data?.content || []);
      setTotalPaginas(respuesta.data?.totalPages || 0);
      setMensaje('');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudieron cargar las facturas. Verifica que el backend esté activo.'));
    } finally {
      setCargando(false);
    }
  }, [pagina, busqueda, fechaDesde, fechaHasta]);

  useEffect(() => {
    const espera = setTimeout(cargar, 250);
    return () => clearTimeout(espera);
  }, [cargar]);

  const visibles = ventas;

  const abrirDetalle = async (id) => {
    try {
      setSeleccionada((await VentaService.getVenta(id)).data);
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo obtener el detalle de la factura.'));
    }
  };

  const anular = async (id) => {
    if (!window.confirm('¿Anular esta venta? El stock de sus productos será restaurado.')) return;
    try {
      await VentaService.deleteVenta(id);
      setSeleccionada(null);
      await cargar();
      setMensaje('Venta anulada y stock restaurado.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo anular la venta.'));
    }
  };

  const imprimir = async (id) => {
    await abrirDetalle(id);
    // Pequena espera para que el modal termine de pintarse antes de imprimir.
    setTimeout(() => window.print(), 200);
  };

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Facturas</h1>
        </div>
        <div className="module-actions">
          <label className="invoice-date-filter">Desde<input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPagina(0); }} /></label>
          <label className="invoice-date-filter">Hasta<input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPagina(0); }} /></label>
          <label className="admin-search">
            <span>⌕</span>
            <input
              value={busqueda}
              onChange={(evento) => { setBusqueda(evento.target.value); setPagina(0); }}
              placeholder="Buscar factura o cliente"
            />
          </label>
          <button
            className="icon-button"
            onClick={() => setMostrarIgv(!mostrarIgv)}
            aria-label="Mostrar u ocultar IGV"
          >
            ▥
          </button>
          <button className="primary-button" onClick={onCreateSale}>+ Nueva venta</button>
        </div>
      </header>

      {mensaje && <div className="admin-notice" role="status">{mensaje}</div>}

      <div className="data-card">
        {cargando ? (
          <div className="empty-state">Cargando facturas…</div>
        ) : visibles.length === 0 ? (
          <div className="empty-state">
            <strong>No hay facturas registradas</strong>
            <span>Registra una venta en Punto de venta para que aparezca aquí.</span>
            <button className="primary-button" onClick={onCreateSale}>Ir a Punto de venta</button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N.º</th><th>Cliente</th><th>Fecha</th><th>Canal</th><th>Método</th>
                  <th>Subtotal</th><th>Descuento</th>{mostrarIgv && <th>IGV</th>}<th>Total</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((venta) => (
                  <tr key={venta.id}>
                    <td>F-{String(venta.id).padStart(5, '0')}</td>
                    <td>
                      <strong>{venta.usuario?.nombre} {venta.usuario?.apellido}</strong>
                      <small>{venta.usuario?.correo}</small>
                    </td>
                    <td>{fechaHora(venta.fecha)}</td>
                    <td><span className="status-pill">{venta.tipo_venta || 'Online'}</span></td>
                    <td><span className="status-pill">{venta.metodo_pago || 'Sin definir'}</span></td>
                    <td>{soles(venta.subtotal)}</td>
                    <td>{venta.descuento ? `− ${soles(venta.descuento)}` : '—'}</td>
                    {mostrarIgv && <td>{soles(venta.igv)}</td>}
                    <td><strong>{soles(venta.total)}</strong></td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => abrirDetalle(venta.id)}>Ver</button>
                        <button onClick={() => imprimir(venta.id)}>Imprimir</button>
                        <button className="danger" onClick={() => anular(venta.id)}>Anular</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPaginas > 1 && (
          <nav className="table-pagination" aria-label="Páginas de facturas">
            <button disabled={pagina === 0} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button>
            <span>Página {pagina + 1} de {totalPaginas}</span>
            <button disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button>
          </nav>
        )}
      </div>

      {seleccionada && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setSeleccionada(null)}>
          <article
            className="admin-modal invoice-print"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <header>
              <div>
                <p>Drop Store</p>
                <h2 id="invoice-title">
                  Factura F-{String(seleccionada.venta.id).padStart(5, '0')}
                </h2>
              </div>
              <button className="icon-button" onClick={() => setSeleccionada(null)} aria-label="Cerrar">×</button>
            </header>

            <dl className="invoice-meta">
              <div>
                <dt>Cliente</dt>
                <dd>
                  {seleccionada.venta.nombreCliente
                    || `${seleccionada.venta.usuario?.nombre || ''} ${seleccionada.venta.usuario?.apellido || ''}`}
                </dd>
              </div>
              <div><dt>Fecha</dt><dd>{fechaHora(seleccionada.venta.fecha)}</dd></div>
              <div><dt>Método</dt><dd>{seleccionada.venta.metodo_pago}</dd></div>
              <div><dt>Canal</dt><dd>{seleccionada.venta.tipo_venta || 'Online'}</dd></div>
              {seleccionada.venta.direccionEnvio && (
                <div><dt>Entrega</dt><dd>{seleccionada.venta.direccionEnvio}</dd></div>
              )}
              {seleccionada.venta.telefonoCliente && (
                <div><dt>Teléfono</dt><dd>{seleccionada.venta.telefonoCliente}</dd></div>
              )}
            </dl>

            <table className="admin-table">
              <thead>
                <tr><th>Producto</th><th>Talla</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr>
              </thead>
              <tbody>
                {seleccionada.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.producto}</td>
                    <td>{item.talla}</td>
                    <td>{item.cantidad}</td>
                    <td>{soles(item.precioUnitario)}</td>
                    <td>{soles(item.precioUnitario * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="invoice-meta">
              <div><dt>Subtotal</dt><dd>{soles(seleccionada.venta.subtotal)}</dd></div>
              <div><dt>Descuento</dt><dd>− {soles(seleccionada.venta.descuento)}</dd></div>
              <div><dt>IGV (18%)</dt><dd>{soles(seleccionada.venta.igv)}</dd></div>
              <div><dt>Envío</dt><dd>{soles(seleccionada.venta.costoEnvio)}</dd></div>
            </dl>

            <div className="invoice-total">
              <span>Total</span>
              <strong>{soles(seleccionada.venta.total)}</strong>
            </div>

            <footer>
              <button className="secondary-button" onClick={() => setSeleccionada(null)}>Cerrar</button>
              <button className="primary-button" onClick={() => window.print()}>Imprimir</button>
            </footer>
          </article>
        </div>
      )}
    </section>
  );
}

export default InvoiceManagement;
