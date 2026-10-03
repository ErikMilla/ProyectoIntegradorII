import { useEffect, useMemo, useState } from 'react';
import VentaService from '../../services/venta.service';
import { mensajeDeError } from '../../services/api';

const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;
const fechaHora = (valor) => (valor
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
  : '—');

/**
 * Ventas registradas, para la pantalla del vendedor.
 *
 * Muestra todas las ventas del dia a dia, no solo las de un usuario: en la
 * tienda la caja la atienden varias personas y a todas les sirve ver lo que se
 * ha cobrado. Cada venta queda asociada al CLIENTE que compro.
 */
function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    VentaService.getAllVentas()
      .then((respuesta) => setVentas(respuesta.data || []))
      .catch((errorPeticion) => setError(mensajeDeError(errorPeticion, 'No se pudo cargar el historial.')))
      .finally(() => setCargando(false));
  }, []);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return ventas;
    return ventas.filter((venta) => {
      const cliente = `${venta.usuario?.nombre || ''} ${venta.usuario?.apellido || ''}`;
      return `${venta.id} ${cliente} ${venta.metodo_pago || ''}`.toLowerCase().includes(termino);
    });
  }, [ventas, busqueda]);

  const totalDelDia = useMemo(
    () => visibles.reduce((suma, venta) => suma + Number(venta.total || 0), 0),
    [visibles],
  );

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Ventas registradas</h1>
        </div>
        <label className="admin-search">
          <span>⌕</span>
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar venta o cliente"
          />
        </label>
      </header>

      {error && <div className="admin-notice" role="alert">{error}</div>}

      <div className="dashboard-metrics">
        <article>
          <span>Ventas mostradas</span>
          <strong>{visibles.length}</strong>
          <small>de {ventas.length} en total</small>
        </article>
        <article>
          <span>Monto acumulado</span>
          <strong>{soles(totalDelDia)}</strong>
          <small>Suma de lo mostrado</small>
        </article>
      </div>

      <div className="data-card">
        {cargando ? (
          <div className="empty-state">Cargando historial…</div>
        ) : visibles.length === 0 ? (
          <div className="empty-state">
            <strong>No hay ventas registradas</strong>
            <span>Cobra la primera desde Nueva venta.</span>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N.º</th><th>Fecha</th><th>Cliente</th>
                  <th>Canal</th><th>Método</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((venta) => (
                  <tr key={venta.id}>
                    <td>F-{String(venta.id).padStart(5, '0')}</td>
                    <td>{fechaHora(venta.fecha)}</td>
                    <td>
                      <strong>{venta.usuario?.nombre} {venta.usuario?.apellido}</strong>
                      <small>{venta.usuario?.correo}</small>
                    </td>
                    <td><span className="status-pill">{venta.tipo_venta || 'Online'}</span></td>
                    <td>{venta.metodo_pago || '—'}</td>
                    <td><strong>{soles(venta.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default HistorialVentas;
