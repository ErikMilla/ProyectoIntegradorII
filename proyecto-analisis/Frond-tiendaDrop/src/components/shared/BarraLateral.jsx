import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { BrandMark } from '../Brand';
import Icon from '../Icon';

const NOMBRE_ROL = {
  ADMIN: 'Administrador',
  ALMACENERO: 'Almacén',
  VENDEDOR: 'Ventas',
};

/**
 * Menu lateral de la intranet, igual para los tres paneles: solo cambian las
 * opciones del menu.
 *
 * @param {Array} opciones  lista de [id, icono, etiqueta]; icono es un nombre de <Icon>
 */
function BarraLateral({ titulo, opciones, seccionActiva, setSeccionActiva }) {
  const { currentUser, logout } = useAuth();
  const iniciales = `${currentUser?.nombre?.[0] || ''}${currentUser?.apellido?.[0] || ''}`.toUpperCase();

  return (
    <aside className="backoffice-sidebar">
      <div className="sidebar-brand">
        <BrandMark className="sidebar-mark" />
        <span>{titulo}</span>
      </div>

      <nav aria-label={titulo}>
        {opciones.map(([id, icono, etiqueta]) => (
          <button
            key={id}
            type="button"
            className={seccionActiva === id ? 'active' : ''}
            aria-current={seccionActiva === id ? 'page' : undefined}
            onClick={() => setSeccionActiva(id)}
            title={etiqueta}
          >
            <Icon name={icono} />
            <span>{etiqueta}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <Link to="/" className="sidebar-store" title="Ver la tienda">
          <Icon name="bag" />
          <span>Ver la tienda</span>
        </Link>
        <div className="sidebar-user">
          <span className="sidebar-avatar" aria-hidden="true">{iniciales || '·'}</span>
          <span className="sidebar-user-info">
            <strong>{currentUser?.nombre}</strong>
            <small>{NOMBRE_ROL[currentUser?.rol] || currentUser?.rol}</small>
          </span>
          <button type="button" onClick={logout} className="sidebar-logout" aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default BarraLateral;
