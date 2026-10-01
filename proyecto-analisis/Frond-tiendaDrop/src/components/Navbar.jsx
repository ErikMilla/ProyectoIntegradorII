import { useContext } from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';
import { useAuth } from '../pages/AuthContext.jsx';
import { CartContext } from '../pages/CartContext.jsx';

function Brand() {
  return (
    <Link to="/" className="nav-logo" aria-label="Drop Store, inicio">
      <span className="brand-mark" aria-hidden="true">▶</span>
      <span>DROP</span>
    </Link>
  );
}

function Navbar() {
  const { currentUser, logout } = useAuth();
  const { itemCount } = useContext(CartContext);

  return (
    <header className="main-header">
      <div className="nav-container">
        <Brand />

        <nav className="category-menu" aria-label="Navegación principal">
          <Link to="/">INICIO</Link>
          <Link to="/catalogo">CATÁLOGO</Link>
          <a href="#nosotros">NOSOTROS</a>
        </nav>

        <div className="nav-actions">
          <form className="search-box" role="search" onSubmit={(event) => event.preventDefault()}>
            <label className="visually-hidden" htmlFor="product-search">Buscar productos</label>
            <input id="product-search" type="search" placeholder="Buscar productos" />
            <button type="submit" aria-label="Buscar productos">⌕</button>
          </form>

          {currentUser ? (
            <>
              <span className="welcome-user">Hola, {currentUser.nombre}</span>
              <button type="button" onClick={logout} className="logout-btn">Salir</button>
            </>
          ) : (
            <Link to="/login" className="nav-icon-button" aria-label="Iniciar sesión">◉</Link>
          )}

          <Link to="/carrito" className="nav-icon-button" aria-label={`Carrito con ${itemCount} productos`}>
            🛒
          </Link>
        </div>
      </div>

      <div className="promo-bar">
        <span aria-hidden="true">▰</span>&nbsp; ENVÍOS GRATIS A TODO EL PERÚ &nbsp;<span aria-hidden="true">✈</span>
      </div>
    </header>
  );
}

export default Navbar;
