import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// El backend histórico persiste estas propiedades con una codificación heredada.
// La UI usa nombres legibles y este adaptador conserva el contrato existente.
const LEGACY_PASSWORD_FIELD = 'contraseÃ±a';
const LEGACY_PASSWORD_CONFIRMATION_FIELD = 'confircontraseÃ±a';

const AuthService = {
  login: ({ correo, contraseña }) => api.post('/api/auth/login', { correo, [LEGACY_PASSWORD_FIELD]: contraseña }),

  register: (user) => api.post('/api/auth/registro', {
    ...user,
    [LEGACY_PASSWORD_FIELD]: user.contraseña,
    [LEGACY_PASSWORD_CONFIRMATION_FIELD]: user.confircontraseña,
  }),

  logout: () => {
    localStorage.removeItem('user');
    return Promise.resolve(true);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default AuthService;
