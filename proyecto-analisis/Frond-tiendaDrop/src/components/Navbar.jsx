// Frond-tiendaDrop/src/components/Navbar.jsx (Modificado)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service'; // Importar servicio de Auth
import '../css/Navbar.css';

function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    // Opcional: Escuchar cambios en localStorage (si usas un Context o Redux, no sería necesario)
    const handleStorageChange = () => {
        setCurrentUser(AuthService.getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    navigate('/'); // Redirigir a Home o Login
    setMenuAbierto(false);
  };
  
  // Determinar la ruta de la intranet para el usuario actual
  const getIntranetPath = () => {
    if (!currentUser) return null;
    switch (currentUser.rol) {
      case 'ADMIN':
        return '/intranet-admin';
      case 'ALMACENERO':
        return '/intranet-almacen';
      case 'VENDEDOR':
        return '/intranet-vendedor';
      default:
        return null;
    }
  };
  
  const intranetPath = getIntranetPath();

  return (
    <nav className="navbar-sneakers">
      <div className="navbar-container">
        <div className="brand-section">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">👟</span>
            <span className="brand-text">TiendaDrop</span>
          </Link>

          <button className="hamburger" onClick={toggleMenu}>
            {menuAbierto ? '✖' : '☰'}
          </button>
        </div>

        <ul className={`nav-links ${menuAbierto ? 'show' : ''}`}>
          <li>
            <Link to="/" onClick={() => setMenuAbierto(false)}>
              <span role="img" aria-label="home">🏠</span> Inicio
            </Link>
          </li>
          
          {/* Enlace a la intranet si está logueado y tiene rol */}
          {currentUser && intranetPath && (
            <li>
              <Link to={intranetPath} onClick={() => setMenuAbierto(false)}>
                <span role="img" aria-label="dashboard">⚙️</span> Intranet ({currentUser.rol})
              </Link>
            </li>
          )}

          {/* Resto de enlaces públicos... */}
          {/* ... */}

          <div className="nav-actions">
            {!currentUser ? (
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
                  <span role="img" aria-label="user">👤</span> {currentUser.nombre}
                </span>
                <button className="btn-logout" onClick={handleLogout}>
                  <span role="img" aria-label="door">🚪</span> Cerrar Sesión
                </button>
              </>
            )}
            
            {/* Iconos adicionales */}
            <button className="icon-btn" aria-label="Buscar">
              <span role="img" aria-label="search">🔍</span>
            </button>
            
            {currentUser && (
              <Link to="/carrito">
                <button className="icon-btn cart-btn" aria-label="Carrito">
                  <span role="img" aria-label="cart">🛒</span>
                  <span className="cart-badge">0</span>
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