import api from './api';

const VentaService = {
  crearVenta: (venta) => api.post('/v1/ventas', venta),
  getHistorial: (usuarioId) => api.get(`/v1/ventas/usuario/${usuarioId}`),
  getAllVentas: () => api.get('/v1/ventas/todas'),
  buscarVentas: ({ page = 0, size = 20, q = '', desde = '', hasta = '' } = {}) => api.get('/v1/ventas/pagina', {
    params: { page, size, q: q || undefined, desde: desde || undefined, hasta: hasta || undefined },
  }),
  getResumenReportes: () => api.get('/v1/ventas/reportes/resumen'),
  getVenta: (id) => api.get(`/v1/ventas/${id}`),
  deleteVenta: (id) => api.delete(`/v1/ventas/${id}`),
};

export default VentaService;
