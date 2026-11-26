import { API_BASE_URL } from './api';

/**
 * Avisos de stock en tiempo real (Server-Sent Events).
 *
 * Todas las pantallas comparten una sola conexión, y solo mientras la pestaña
 * está visible. El navegador admite pocas conexiones simultáneas por servidor
 * (6 en HTTP/1.1); si cada pestaña oculta, o cada página guardada en la caché
 * de atrás/adelante, mantuviera la suya abierta, con unas pocas pestañas las
 * demás peticiones de la tienda se quedarían esperando.
 *
 * Al volver a la pestaña se reabre la conexión y se avisa a las pantallas para
 * que recarguen, porque mientras estuvo cerrada pudo cambiar el stock.
 */
let conexion;
const suscriptores = new Set();

const avisarATodos = () => suscriptores.forEach((avisar) => avisar());

const pestanaOculta = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

const abrir = () => {
  if (conexion || suscriptores.size === 0 || typeof EventSource === 'undefined' || pestanaOculta()) return false;
  conexion = new EventSource(`${API_BASE_URL}/api/stock/eventos`, { withCredentials: true });
  conexion.addEventListener('stock', avisarATodos);
  conexion.onerror = () => {
    // EventSource se reconecta automáticamente; no se interrumpe la pantalla.
  };
  return true;
};

const cerrar = () => {
  if (!conexion) return;
  conexion.close();
  conexion = undefined;
};

const reanudar = () => {
  if (abrir()) avisarATodos();
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => (pestanaOculta() ? cerrar() : reanudar()));
  window.addEventListener('pagehide', cerrar);
  // Al volver con "atrás" desde la caché del navegador la página no se recarga.
  window.addEventListener('pageshow', (evento) => { if (evento.persisted) reanudar(); });
}

const StockService = {
  suscribir: (avisar) => {
    suscriptores.add(avisar);
    abrir();
    return () => {
      suscriptores.delete(avisar);
      if (suscriptores.size === 0) cerrar();
    };
  },
};

export default StockService;
