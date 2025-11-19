import React, { useContext } from 'react'; // 1. AÑADIMOS 'useContext'
import { Link } from 'react-router-dom';
import '../css/Navbar.css';

import { useAuth } from '../pages/AuthContext.jsx';
// 2. IMPORTAMOS 'CartContext' (NO 'useCart')
import { CartContext } from '../pages/CartContext.jsx';

function Navbar() {
  const { currentUser, logout } = useAuth();

  // 3. USAMOS EL 'useContext' DE REACT DIRECTAMENTE
  const { itemCount, cartTotal } = useContext(CartContext);

  return (
    <header className="main-header">
      <div className="top-nav">
        <div className="nav-container">

          {/* Logo */}
          <Link to="/" className="nav-logo">
            TIENDADROP
          </Link>

          {/* Menú de Categorías */}
          <nav className="category-menu">
            <Link to="/catalogo">SNEAKERS</Link>
            <Link to="/catalogo/Hombre">HOMBRE</Link>
            <Link to="/catalogo/Mujer">MUJER</Link>
          </nav>

          {/* Iconos */}
          <div className="nav-icons">

            {/* Buscador */}
            <div className="search-box">
              <input type="text" placeholder="Buscar productos..." />
              <button className="search-icon" aria-label="Buscar">
                🔍
              </button>
            </div>

            {/* Lógica de Autenticación */}
            {currentUser ? (
              <div className="user-info">
                <span className="welcome-user">Hola, {currentUser.nombre}</span>
                <button
                  onClick={logout}
                  className="icon-btn logout-btn"
                  aria-label="Cerrar Sesión"
                  title="Cerrar Sesión"
                >
                  (Salir)
                  </button>
              </div>
            ) : (
              <Link to="/login" className="icon-btn" aria-label="Cuenta" title="Iniciar Sesión">
                👤
              </Link>
            )}

            {/* Lógica del Carrito (Esto ya estaba bien) */}
            <Link to="/carrito" className="icon-btn cart-icon" aria-label="Carrito">
              🛒
              <span>{itemCount} / S/ {cartTotal.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de promociones */}
      <div className="promo-bar">
        <p>3 cuotas sin intereses con BCP, Visa, BBVA, Interbank, Diners y CMR Falabella. <Link to="/terminos">Ver TyC</Link></p>
      </div>
    </header>
  );
}

export default Navbar;