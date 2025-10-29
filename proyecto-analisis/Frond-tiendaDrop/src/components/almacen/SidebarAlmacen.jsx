// Frond-tiendaDrop/src/components/almacen/SidebarAlmacen.jsx

import React from 'react';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

function SidebarAlmacen({ seccionActiva, setSeccionActiva }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/'); 
  };

  return (
    <div className="sidebar">
      <h3>Inventario DropStore</h3>

      <button 
        className={`sidebar-button ${seccionActiva === 'inventario' ? 'active' : ''}`}
        onClick={() => setSeccionActiva('inventario')}
      >
        <span role="img" aria-label="productos">📦</span> Gestión de Productos
      </button>

      <button 
        className={`sidebar-button ${seccionActiva === 'categorias' ? 'active' : ''}`}
        onClick={() => setSeccionActiva('categorias')}
      >
        <span role="img" aria-label="categorias">🏷️</span> Gestión de Categorías
      </button>

      <button 
        className={`sidebar-button ${seccionActiva === 'marcas' ? 'active' : ''}`}
        onClick={() => setSeccionActiva('marcas')}
      >
        <span role="img" aria-label="marcas">🏢</span> Gestión de Marcas
      </button>

      {/* Botón de Cerrar Sesión en el Sidebar */}
      <button 
        className="sidebar-logout" 
        onClick={handleLogout}
      >
        <span role="img" aria-label="door">🚪</span> Cerrar Sesión
      </button>
    </div>
  );
}

export default SidebarAlmacen;