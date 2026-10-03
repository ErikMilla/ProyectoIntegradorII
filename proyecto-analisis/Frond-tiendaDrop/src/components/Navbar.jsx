import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import '../css/Navbar.css';
import { useAuth } from '../context/auth';
import { CartContext } from '../context/cart';
import ContentService from '../services/content.service';
import { inicioSegunRol } from '../utils/navegacion';
import Brand from './Brand';
import Icon from './Icon';

const MENSAJE_POR_DEFECTO = 'Envíos gratis a todo el Perú';

const ENLACES = [
  { to: '/catalogo/Hombre', label: 'Hombre' },
  { to: '/catalogo/Mujer', label: 'Mujer' },
  { to: '/catalogo/Niños', label: 'Niños' },
  { to: '/catalogo', label: 'Todo', end: true },
  { to: '/nosotros', label: 'Nosotros' },
];

function Navbar() {
  const { currentUser, logout } = useAuth();
  const { itemCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '');
  const [mensajePromocional, setMensajePromocional] = useState(MENSAJE_POR_DEFECTO);

  useEffect(() => {
    ContentService.obtener()
      .then(({ data }) => setMensajePromocional(data.mensajePromocional || MENSAJE_POR_DEFECTO))
      .catch(() => {});
  }, []);

  const buscar = (event) => {
    event.preventDefault();
    const termino = busqueda.trim();
    navigate(termino ? `/catalogo?q=${encodeURIComponent(termino)}` : '/catalogo');
  };

  const esCliente = currentUser?.rol === 'CLIENTE';
  const esPersonal = currentUser && !esCliente;

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <p className="promo-bar">{mensajePromocional}</p>

      <header className="site-header">
        <div className="container site-header-inner">
          <Brand />

          <nav className="site-nav" aria-label="Navegación principal">
            <ul>
              {ENLACES.map((enlace) => (
                <li key={enlace.to}>
                  <NavLink to={enlace.to} end={enlace.end}>{enlace.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <form className="site-search" role="search" onSubmit={buscar}>
            <label className="visually-hidden" htmlFor="product-search">Buscar zapatillas</label>
            <Icon name="search" size={18} />
            <input
              id="product-search"
              type="search"
              placeholder="Buscar modelo o marca"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </form>

          <div className="site-actions">
            {currentUser ? (
              <>
                <span className="site-greeting">Hola, {currentUser.nombre}</span>
                {esCliente && (
                  <Link to="/mis-pedidos" className="site-action" aria-label="Mis pedidos" title="Mis pedidos">
                    <Icon name="receipt" />
                  </Link>
                )}
                {esPersonal && (
                  <Link to={inicioSegunRol(currentUser.rol)} className="site-action site-action--text">
                    Mi panel
                  </Link>
                )}
                <button type="button" onClick={logout} className="site-action" aria-label="Cerrar sesión" title="Cerrar sesión">
                  <Icon name="logout" />
                </button>
              </>
            ) : (
              <Link to="/login" className="site-action" aria-label="Iniciar sesión" title="Iniciar sesión">
                <Icon name="user" />
              </Link>
            )}

            <Link
              to="/carrito"
              className="site-action site-cart"
              aria-label={itemCount > 0 ? `Carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}` : 'Carrito vacío'}
              title="Carrito"
            >
              <Icon name="bag" />
              {itemCount > 0 && <span className="site-cart-count" aria-hidden="true">{itemCount}</span>}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
