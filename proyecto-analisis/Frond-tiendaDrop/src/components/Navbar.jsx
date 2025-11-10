// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';

// 1. IMPORTAR LOS HOOKS DE TUS CONTEXTOS
// (Asegúrate que la ruta a 'pages' sea correcta desde 'components')
import { useAuth } from '../pages/AuthContext.jsx'; 
import { useCart } from '../pages/CartContext.jsx';

function Navbar() {
  // 2. LLAMAR A LOS HOOKS PARA OBTENER LOS DATOS
  const { currentUser, logout } = useAuth(); // Para la sesión de usuario
  const { itemCount, cartTotal } = useCart();  // Para el carrito

  return (
    <header className="main-header">
      {/* 1. Barra superior: Menú principal y Logotipo */}
      <div className="top-nav">
        <div className="nav-container">
          
          {/* Logo */}
          <Link to="/" className="nav-logo">
            TIENDADROP
          </Link>

          {/* Menú de Categorías (Botones funcionales) */}
          <nav className="category-menu">
            <Link to="/catalogo">SNEAKERS</Link> 
            <Link to="/catalogo/Hombre">HOMBRE</Link> 
            <Link to="/catalogo/Mujer">MUJER</Link> 
          </nav>

          {/* Iconos de Búsqueda y Cuenta/Carrito */}
          <div className="nav-icons">
            
            {/* Buscador */}
            <div className="search-box">
              <input type="text" placeholder="Buscar productos..." />
              <button className="search-icon" aria-label="Buscar">
                🔍
              </button>
            </div>
            
            {/* 3. LÓGICA DE AUTENTICACIÓN */}
            {currentUser ? (
              // A. Si el usuario SÍ está logueado
              <div className="user-info">
                {/* Usamos 'currentUser.nombre' como me confirmaste */}
                <span className="welcome-user">Hola, {currentUser.nombre}</span>
                
                {/* Botón para cerrar sesión */}
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
              // B. Si el usuario NO está logueado
              <Link to="/login" className="icon-btn" aria-label="Cuenta" title="Iniciar Sesión">
                👤
              </Link>
            )}

            {/* 4. LÓGICA DEL CARRITO */}
            <Link to="/carrito" className="icon-btn cart-icon" aria-label="Carrito">
              🛒 
              {/* Mostramos los datos dinámicos del CartContext */}
              <span>{itemCount} / S/ {cartTotal.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Barra de promociones */}
      <div className="promo-bar">
        <p>3 cuotas sin intereses con BCP, Visa, BBVA, Interbank, Diners y CMR Falabella. <Link to="/terminos">Ver TyC</Link></p>
      </div>

    </header>
  );
}

export default Navbar;