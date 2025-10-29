// Frond-tiendaDrop/src/services/auth.service.js (Modificado)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Asegura que se envían cookies si las usas para la sesión
});

const AuthService = {
  login: ({ correo, contraseña }) => {
    return api.post('/api/auth/login', { correo, contraseña });
  },

  register: (user) => {
    return api.post('/api/auth/registro', user);
  },
  
  // NUEVA FUNCIÓN DE LOGOUT
  logout: () => {
    // En Spring Boot con JWT o sesiones, el logout del cliente solo elimina el token/sesión local.
    localStorage.removeItem('user');
    // Si tu backend tiene un endpoint de /logout para limpiar el lado del servidor, llámalo aquí.
    // return api.post('/api/auth/logout'); 
    return Promise.resolve(true);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default AuthService;