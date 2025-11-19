import axios from 'axios';

const API_URL = 'http://localhost:8081/api/usuarios';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const UserService = {
  getClientes: () => {
    return api.get('/clientes');
  }
};

export default UserService;