import { API_BASE_URL } from './api';

let conexion;
const suscriptores = new Set();

const asegurarConexion = () => {
  if (conexion || typeof EventSource === 'undefined') return;
  conexion = new EventSource(`${API_BASE_URL}/api/stock/eventos`, { withCredentials: true });
  conexion.addEventListener('stock', () => suscriptores.forEach((avisar) => avisar()));
  conexion.onerror = () => {
    // EventSource se reconecta automáticamente; no se interrumpe la pantalla.
  };
};

const StockService = {
  suscribir: (avisar) => {
    suscriptores.add(avisar);
    asegurarConexion();
    return () => {
      suscriptores.delete(avisar);
      if (suscriptores.size === 0 && conexion) {
        conexion.close();
        conexion = undefined;
      }
    };
  },
};

export default StockService;
