import axios from 'axios';

const API_URL = 'http://localhost:8081/api/v1/ventas';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const VentaService = {
  crearVenta: (ventaData) => {
    return api.post('', ventaData); // Hace un POST a http://localhost:8081/api/v1/ventas
  },

   getHistorial: (usuarioId) => {
    return api.get(`/usuario/${usuarioId}`);
  },
  getAllVentas: () => {
    return api.get('/todas'); // Llama al nuevo endpoint del backend
  },
};



export default VentaService;