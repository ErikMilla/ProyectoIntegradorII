// src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css';

function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isLoggedIn] = useState(false); // Cambiar según tu lógica de autenticación
  const [nombre] = useState('Usuario');

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const handleLogout = () => {
    // Aquí va tu lógica de logout
    console.log('Cerrando sesión...');
  };

  return (
    <nav className="navbar-sneakers">
      <div className="navbar-container">
        {/* Logo y Brand */}
        <div className="brand-section">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">👟</span>
            <span className="brand-text">TiendaDrop</span>
          </Link>

          <button className="hamburger" onClick={toggleMenu}>
            {menuAbierto ? '✖' : '☰'}
          </button>
        </div>

        {/* Enlaces de navegación */}
        <ul className={`nav-links ${menuAbierto ? 'show' : ''}`}>
          <li>
            <Link to="/" onClick={() => setMenuAbierto(false)}>
              <span role="img" aria-label="home">🏠</span> Inicio
            </Link>
          </li>
          <li>
            <Link to="/hombre" onClick={() => setMenuAbierto(false)}>
              <span role="img" aria-label="men">👨</span> Hombre
            </Link>
          </li>
          <li>
            <Link to="/mujer" onClick={() => setMenuAbierto(false)}>
              <span role="img" aria-label="women">👩</span> Mujer
            </Link>
          </li>
          <li>
            <Link to="/ofertas" onClick={() => setMenuAbierto(false)}>
              <span role="img" aria-label="fire">🔥</span> Ofertas
            </Link>
          </li>

          {/* Botones de sesión */}
          <div className="nav-actions">
            {!isLoggedIn ? (
              <>
                <Link to="/login">
                  <button className="btn-login" onClick={() => setMenuAbierto(false)}>
                    <span role="img" aria-label="key">🔑</span> Iniciar Sesión
                  </button>
                </Link>
                <Link to="/registro">
                  <button className="btn-register" onClick={() => setMenuAbierto(false)}>
                    <span role="img" aria-label="user">👤</span> Registro
                  </button>
                </Link>
              </>
            ) : (
              <>
                <span className="user-name">
                  <span role="img" aria-label="user">👤</span> {nombre}
                </span>
                <button className="btn-logout" onClick={() => { handleLogout(); setMenuAbierto(false); }}>
                  <span role="img" aria-label="door">🚪</span> Cerrar Sesión
                </button>
              </>
            )}
            
            {/* Iconos adicionales */}
            <button className="icon-btn" aria-label="Buscar">
              <span role="img" aria-label="search">🔍</span>
            </button>
            
            {isLoggedIn && (
              <Link to="/carrito">
                <button className="icon-btn cart-btn" aria-label="Carrito">
                  <span role="img" aria-label="cart">🛒</span>
                  <span className="cart-badge">3</span>
                </button>
              </Link>
            )}
          </div>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;