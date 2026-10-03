import api from './api';

/**
 * Operaciones sobre el catalogo: categorias, marcas y productos con sus tallas.
 *
 * Un "producto" es el modelo (ej. Air Force 1 blanca) y una "variante" o
 * "detalle" es una talla concreta de ese modelo, con su propio stock. El
 * backend devuelve siempre la lista de variantes; agruparPorProducto() las
 * junta por modelo para mostrarlas en pantalla.
 */
const InventoryService = {
  // === CATEGORIAS ===
  getAllCategorias: () => api.get('/categorias'),
  createCategoria: (nombre) => api.post('/categorias', { nombre }),
  updateCategoria: (id, nombre) => api.put(`/categorias/${id}`, { nombre }),
  deleteCategoria: (id) => api.delete(`/categorias/${id}`),

  // === MARCAS ===
  getAllMarcas: () => api.get('/marcas'),
  createMarca: (nombre) => api.post('/marcas', { nombre }),
  updateMarca: (id, nombre) => api.put(`/marcas/${id}`, { nombre }),
  deleteMarca: (id) => api.delete(`/marcas/${id}`),

  // === PRODUCTOS ===
  /** Devuelve todas las variantes. Acepta filtros { genero, marca }. */
  getAllProductos: (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.genero) params.append('genero', filtros.genero);
    if (filtros.marca) params.append('marca', filtros.marca);
    const consulta = params.toString();
    return api.get(consulta ? `/productos?${consulta}` : '/productos');
  },
  getMasVendidos: () => api.get('/productos/mas-vendidos'),

  /**
   * Crear producto requiere multipart porque incluye la foto.
   * Recibe el objeto { producto, variantes } y el archivo de imagen.
   */
  createProducto: (payload, archivoFoto) => {
    const cuerpo = new FormData();
    cuerpo.append('file', archivoFoto);
    cuerpo.append('data', JSON.stringify(payload));
    // Se deja que el navegador ponga el Content-Type con su boundary.
    return api.post('/productos', cuerpo, { headers: { 'Content-Type': undefined } });
  },

  getProductoConVariantes: (id) => api.get(`/productos/${id}`),
  updateProducto: (id, payload) => api.put(`/productos/${id}`, payload),
  deleteProduct: (id) => api.delete(`/productos/${id}`),
};

export default InventoryService;
