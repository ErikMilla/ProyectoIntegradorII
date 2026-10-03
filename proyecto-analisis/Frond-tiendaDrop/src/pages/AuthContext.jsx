import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service.js';
import { mensajeDeError } from '../services/api.js';
import { destinoTrasLogin } from '../utils/navegacion';
import { AuthContext } from '../context/auth';

/**
 * Guarda quien inicio sesion y lo comparte con toda la aplicacion.
 * La sesion se conserva en localStorage para que al recargar la pagina el
 * usuario siga dentro.
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Al abrir la aplicacion, preguntamos al servidor si la sesion sigue activa.
  useEffect(() => {
    AuthService.getCurrentUser()
      .then((usuario) => setCurrentUser(usuario))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credenciales) => {
    try {
      const { data } = await AuthService.login(credenciales);

      if (data.mfaRequired) {
        return { success: true, mfaRequired: true, challenge: data };
      }

      setCurrentUser(data);

      // Cada rol entra siempre a su propio escritorio. Solo se respeta el
      // destino previo si era una pagina de la tienda (p. ej. el checkout).
      navigate(destinoTrasLogin(data.rol, location.state?.destino), { replace: true });

      return { success: true };
    } catch (error) {
      return { success: false, error: mensajeDeError(error, 'No pudimos validar tus credenciales.') };
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setCurrentUser(null);
      navigate('/login');
    }
  };

  const verifyMfa = async ({ challengeId, codigo }) => {
    try {
      const { data: usuario } = await AuthService.verificarMfa({ challengeId, codigo });
      setCurrentUser(usuario);
      navigate(destinoTrasLogin(usuario.rol, location.state?.destino), { replace: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: mensajeDeError(error, 'No pudimos validar el código.') };
    }
  };

  const resendMfa = async (challengeId) => {
    try {
      const { data } = await AuthService.reenviarMfa(challengeId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: mensajeDeError(error, 'No pudimos reenviar el código.') };
    }
  };

  const value = { currentUser, loading, login, verifyMfa, resendMfa, logout };

  // No renderizamos nada hasta saber si hay sesion, para evitar que una ruta
  // protegida mande al login por un instante antes de leer localStorage.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
