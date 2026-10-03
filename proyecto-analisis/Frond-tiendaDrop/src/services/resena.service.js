import api from './api';

/** Comentarios y calificaciones de los clientes sobre un producto. */
const ResenaService = {
  listar: (productoId) => api.get(`/productos/${productoId}/resenas`),
  crear: (productoId, resena) => api.post(`/productos/${productoId}/resenas`, resena),
  eliminar: (productoId, resenaId) => api.delete(`/productos/${productoId}/resenas/${resenaId}`),
};

export default ResenaService;
