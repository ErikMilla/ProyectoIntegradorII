const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;

function ClientPurchaseHistory({ cliente, ventas, onClose }) {
  if (!cliente) return null;
  const compras = ventas.filter((venta) => venta.usuario?.id === cliente.id);

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="client-history-title">
        <header className="card-heading">
          <div>
            <p>Historial de compras</p>
            <h2 id="client-history-title">{cliente.nombre} {cliente.apellido}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar historial">×</button>
        </header>
        {compras.length === 0 ? (
          <div className="empty-state">Este cliente todavía no tiene compras.</div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>Comprobante</th><th>Fecha</th><th>Canal</th><th>Pago</th><th>Descuento</th><th>Total</th></tr></thead>
              <tbody>
                {compras.map((venta) => (
                  <tr key={venta.id}>
                    <td>F-{String(venta.id).padStart(5, '0')}</td>
                    <td>{new Date(venta.fecha).toLocaleDateString('es-PE')}</td>
                    <td>{venta.tipo_venta || 'Online'}</td>
                    <td>{venta.metodo_pago || '—'}</td>
                    <td>{venta.descuento ? `− ${soles(venta.descuento)}` : '—'}</td>
                    <td><strong>{soles(venta.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ClientPurchaseHistory;
