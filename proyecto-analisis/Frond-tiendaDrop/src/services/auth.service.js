// services/auth.service.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

const AuthService = {
  login: ({ correo, contraseña }) => {
    return api.post('/api/auth/login', { correo, contraseña });
  },

  register: (user) => {
    return api.post('/api/auth/registro', user);
  }
};

export default AuthService;