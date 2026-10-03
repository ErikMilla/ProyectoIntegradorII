import { useEffect, useMemo, useState } from 'react';
import InventoryService from '../../services/inventory.service';
import { mensajeDeError } from '../../services/api';

/** Una variante con 5 o menos unidades se considera stock bajo. */
const UMBRAL_STOCK_BAJO = 5;

/**
 * Pantalla de entrada del almacenero: qué tallas se están por acabar.
 *
 * Antes esta información solo aparecía en el dashboard del administrador, al
 * que el almacenero no tiene acceso. Es su trabajo del día a día, así que
 * necesita verla de frente al entrar, sin tener que ir a buscarla.
 */
function AlertasStock({ onNavigate }) {
  const [variantes, setVariantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    InventoryService.getAllProductos()
      .then((respuesta) => setVariantes(respuesta.data || []))
      .catch((errorPeticion) => setError(mensajeDeError(errorPeticion, 'No se pudo cargar el inventario.')))
      .finally(() => setCargando(false));
  }, []);

  const stockBajo = useMemo(
    () => [...variantes]
      .filter((variante) => variante.stock <= UMBRAL_STOCK_BAJO)
      .sort((a, b) => a.stock - b.stock),
    [variantes],
  );

  const agotados = useMemo(() => stockBajo.filter((v) => v.stock === 0), [stockBajo]);

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Alertas de stock</h1>
        </div>
        {onNavigate && (
          <button className="primary-button" onClick={() => onNavigate('inventario')}>Ir a inventario</button>
        )}
      </header>

      {error && <div className="admin-notice" role="alert">{error}</div>}

      {!cargando && (
        <div className="dashboard-metrics">
          <article className={stockBajo.length ? 'warning-metric' : ''}>
            <span>Tallas con stock bajo</span>
            <strong>{stockBajo.length}</strong>
            <small>Con {UMBRAL_STOCK_BAJO} unidades o menos</small>
          </article>
          <article className={agotados.length ? 'warning-metric' : ''}>
            <span>Tallas agotadas</span>
            <strong>{agotados.length}</strong>
            <small>Sin ninguna unidad disponible</small>
          </article>
          <article>
            <span>Total de variantes</span>
            <strong>{variantes.length}</strong>
            <small>Entre todos los productos</small>
          </article>
        </div>
      )}

      <div className="data-card">
        {cargando ? (
          <div className="empty-state">Cargando inventario…</div>
        ) : stockBajo.length === 0 ? (
          <div className="empty-state">
            <strong>Sin alertas</strong>
            <span>El stock está saludable.</span>
          </div>
        ) : (
          <ul className="alert-list">
            {stockBajo.map((variante) => (
              <li key={variante.id}>
                <span>
                  <strong>{variante.producto?.nombre}</strong>
                  <small>Talla {variante.talla} · {variante.marca?.nombre}</small>
                </span>
                <b>{variante.stock === 0 ? 'Agotado' : `${variante.stock} u.`}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default AlertasStock;
