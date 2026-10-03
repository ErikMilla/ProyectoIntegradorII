import api from './api';

const UserService = {
  getAll: () => api.get('/usuarios'),
  getClientes: () => api.get('/usuarios/clientes'),
  create: (usuario) => api.post('/usuarios', usuario),
  update: (id, usuario) => api.put(`/usuarios/${id}`, usuario),
  remove: (id) => api.delete(`/usuarios/${id}`),
};

export default UserService;
