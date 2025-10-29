import axios from 'axios';

// Usamos la misma configuración base que auth.service.js
const API_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const InventoryService = {
  // === CATEGORÍAS ===
  getAllCategorias: () => {
    return api.get('/categorias');
  },
  createCategoria: (nombre) => {
    return api.post('/categorias', { nombre });
  },
  updateCategoria: (id, nombre) => {
    return api.put(`/categorias/${id}`, { nombre });
  },
  deleteCategoria: (id) => {
    return api.delete(`/categorias/${id}`);
  },

  // === MARCAS ===
  getAllMarcas: () => {
    return api.get('/marcas');
  },
  createMarca: (nombre) => {
    return api.post('/marcas', { nombre });
  },
  updateMarca: (id, nombre) => {
    return api.put(`/marcas/${id}`, { nombre });
  },
  deleteMarca: (id) => {
    return api.delete(`/marcas/${id}`);
  },
  
  // === PRODUCTOS (A IMPLEMENTAR LUEGO) ===
  // ...
};

export default InventoryService;