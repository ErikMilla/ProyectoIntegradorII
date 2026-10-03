import axios from 'axios';

/**
 * Punto unico donde se define a que servidor apunta el frontend.
 *
 * Antes la direccion "http://localhost:8081" estaba escrita a mano en siete
 * archivos distintos. Ahora se cambia solo aqui, o sin tocar codigo creando un
 * archivo .env en la raiz del frontend:
 *
 *   VITE_API_URL=http://192.168.1.50:8081
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

/** Cliente HTTP compartido por todos los servicios. */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  withXSRFToken: true,
});

/**
 * Convierte la ruta de una foto guardada en el backend ("/uploads/x.jpg") en
 * una URL completa que el navegador pueda cargar.
 */
export const resolverUrlImagen = (ruta) => {
  if (!ruta) return '';
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
  return `${API_BASE_URL}${ruta}`;
};

/** Extrae el mensaje de error del backend, sea texto plano o JSON. */
export const mensajeDeError = (error, respaldo = 'Ocurrió un error inesperado.') => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.error || data?.message || respaldo;
};

export default api;
