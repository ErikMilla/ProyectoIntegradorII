import { useEffect, useMemo, useState } from 'react';
import VentaService from '../../services/venta.service';

const money = (value) => `S/${Number(value || 0).toFixed(2)}`;
const date = (value) => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function InvoiceManagement({ onCreateSale }) {
  const [sales, setSales] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showTax, setShowTax] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setSales((await VentaService.getAllVentas()).data || []); setMessage(''); }
    catch { setMessage('No se pudieron cargar las facturas. Verifica que el backend esté activo.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => sales.filter((sale) => {
    const client = `${sale.usuario?.nombre || ''} ${sale.usuario?.apellido || ''}`;
    return `${sale.id} ${client} ${sale.metodo_pago || ''}`.toLowerCase().includes(query.toLowerCase());
  }), [sales, query]);

  const openDetail = async (id) => {
    try { setSelected((await VentaService.getVenta(id)).data); }
    catch { setMessage('No se pudo obtener el detalle de la factura.'); }
  };
  const remove = async (id) => {
    if (!window.confirm('¿Anular esta venta? El stock de sus productos será restaurado.')) return;
    try { await VentaService.deleteVenta(id); setSelected(null); await load(); setMessage('Venta anulada y stock restaurado.'); }
    catch { setMessage('No se pudo anular la venta.'); }
  };

  return <section className="admin-module">
    <header className="module-header"><div><p>GESTIÓN COMERCIAL</p><h1>Facturas</h1></div><div className="module-actions"><label className="admin-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar factura o cliente" /></label><button className="icon-button" onClick={() => setShowTax(!showTax)} aria-label="Mostrar u ocultar IGV">▥</button><button className="primary-button" onClick={onCreateSale}>+ Nueva venta</button></div></header>
    {message && <div className="admin-notice" role="status">{message}</div>}
    <div className="data-card">
      {loading ? <div className="empty-state">Cargando facturas…</div> : filtered.length === 0 ? <div className="empty-state"><strong>No hay facturas registradas</strong><span>Realiza una venta desde el POS para que aparezca aquí.</span><button className="primary-button" onClick={onCreateSale}>Ir al POS</button></div> : <div className="table-scroll"><table className="admin-table"><thead><tr><th>N.º</th><th>Cliente</th><th>Fecha</th><th>Método</th><th>Subtotal</th>{showTax && <th>IGV</th>}<th>Total</th><th>Acciones</th></tr></thead><tbody>{filtered.map((sale) => <tr key={sale.id}><td>F-{String(sale.id).padStart(5, '0')}</td><td><strong>{sale.usuario?.nombre} {sale.usuario?.apellido}</strong><small>{sale.usuario?.correo}</small></td><td>{date(sale.fecha)}</td><td><span className="status-pill">{sale.metodo_pago || 'Sin definir'}</span></td><td>{money(sale.subtotal)}</td>{showTax && <td>{money(sale.igv)}</td>}<td><strong>{money(sale.total)}</strong></td><td><div className="row-actions"><button onClick={() => openDetail(sale.id)}>Ver</button><button onClick={() => { openDetail(sale.id).then(() => setTimeout(() => window.print(), 150)); }}>Imprimir</button><button className="danger" onClick={() => remove(sale.id)}>Anular</button></div></td></tr>)}</tbody></table></div>}
    </div>
    {selected && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><article className="admin-modal invoice-print" role="dialog" aria-modal="true" aria-labelledby="invoice-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>DROP STORE</p><h2 id="invoice-title">Factura F-{String(selected.venta.id).padStart(5, '0')}</h2></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar">×</button></header><dl className="invoice-meta"><div><dt>Cliente</dt><dd>{selected.venta.usuario?.nombre} {selected.venta.usuario?.apellido}</dd></div><div><dt>Fecha</dt><dd>{date(selected.venta.fecha)}</dd></div><div><dt>Método</dt><dd>{selected.venta.metodo_pago}</dd></div></dl><table className="admin-table"><thead><tr><th>Producto</th><th>Talla</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>{selected.items.map((item) => <tr key={item.id}><td>{item.producto}</td><td>{item.talla}</td><td>{item.cantidad}</td><td>{money(item.precioUnitario)}</td><td>{money(item.precioUnitario * item.cantidad)}</td></tr>)}</tbody></table><div className="invoice-total"><span>Total</span><strong>{money(selected.venta.total)}</strong></div><footer><button className="secondary-button" onClick={() => setSelected(null)}>Cerrar</button><button className="primary-button" onClick={() => window.print()}>Imprimir</button></footer></article></div>}
  </section>;
}

export default InvoiceManagement;
