// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';

function Navbar() {
  // Los botones de Login/Registro se reubican en los iconos de usuario

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
      
            
            {/* 1. Enlace genérico SNKEAKERS ahora apunta a la ruta de catálogo sin filtro */}
            <Link to="/catalogo">SNEAKERS</Link> 
            
          
            
            {/* 2. Enlace HOMBRE apunta al catálogo con el filtro Hombre */}
            <Link to="/catalogo/Hombre">HOMBRE</Link> 
            
            {/* 3. Enlace MUJER apunta al catálogo con el filtro Mujer */}
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
            
            {/* Icono de Usuario (Contiene Login/Registro) */}
            <Link to="/login" className="icon-btn" aria-label="Cuenta">
              👤
            </Link>

            {/* Icono de Carrito */}
            <Link to="/carrito" className="icon-btn cart-icon" aria-label="Carrito">
              🛒 <span>0/0.00</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Barra de promociones (similar a la barra azul debajo del INBOX logo) */}
      <div className="promo-bar">
        <p>3 cuotas sin intereses con BCP, Visa, BBVA, Interbank, Diners y CMR Falabella. <Link to="/terminos">Ver TyC</Link></p>
      </div>

    </header>
  );
}

export default Navbar;