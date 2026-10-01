import axios from 'axios';

const API_URL = 'http://localhost:8081/api/usuarios';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const UserService = {
  getAll: () => api.get(''),
  getClientes: () => {
    return api.get('/clientes');
  },
  create: (user) => api.post('', user),
  update: (id, user) => api.put(`/${id}`, user),
  remove: (id) => api.delete(`/${id}`),
};

export default UserService;
