import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { inicioSegunRol } from '../utils/navegacion';

/**
 * Envuelve una ruta para que solo entren los usuarios autorizados.
 *
 *   <RutaProtegida roles={['ADMIN']}>  ... </RutaProtegida>
 *
 * - Sin sesion  -> manda al login y recuerda a donde queria ir.
 * - Con sesion pero sin el rol -> lo devuelve a su propio escritorio.
 * - Sin la prop roles -> basta con haber iniciado sesion.
 */

function RutaProtegida({ roles, children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ destino: location.pathname }} replace />;
  }

  if (roles && !roles.includes(currentUser.rol)) {
    return <Navigate to={inicioSegunRol(currentUser.rol)} replace />;
  }

  return children;
}

export default RutaProtegida;
