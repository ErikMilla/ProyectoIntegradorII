import api from './api';

let csrfInicializado;

const asegurarCsrf = () => {
  if (!csrfInicializado) {
    csrfInicializado = api.get('/auth/csrf').catch((error) => {
      csrfInicializado = null;
      throw error;
    });
  }
  return csrfInicializado;
};

const AuthService = {
  inicializar: asegurarCsrf,

  login: async ({ correo, contraseña }) => {
    await asegurarCsrf();
    return api.post('/auth/login', { correo, contraseña });
  },

  verificarMfa: async ({ challengeId, codigo }) => {
    await asegurarCsrf();
    return api.post('/auth/mfa/verificar', { challengeId, codigo });
  },

  reenviarMfa: async (challengeId) => {
    await asegurarCsrf();
    return api.post('/auth/mfa/reenviar', { challengeId });
  },

  register: async (usuario) => {
    await asegurarCsrf();
    return api.post('/auth/registro', usuario);
  },

  verificarRegistro: async ({ challengeId, codigo }) => {
    await asegurarCsrf();
    return api.post('/auth/registro/verificar', { challengeId, codigo });
  },

  reenviarRegistro: async (challengeId) => {
    await asegurarCsrf();
    return api.post('/auth/registro/reenviar', { challengeId });
  },

  logout: async () => {
    await asegurarCsrf();
    return api.post('/auth/logout');
  },

  getCurrentUser: async () => {
    await asegurarCsrf();
    return (await api.get('/auth/verificar')).data;
  },
};

export default AuthService;
