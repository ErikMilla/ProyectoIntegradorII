import React from 'react';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

// Usamos props 'seccionActiva' y 'setSeccionActiva' para manejar la vista
function SidebarAlmacen({ seccionActiva, setSeccionActiva }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/'); 
  };

  return (
    <div className="sidebar">
        
        {/* 1. Encabezado y Logo */}
        <div className="sidebar-header">
            <h2>📦 DropStore</h2>
            <p>Panel de Control de Inventario</p>
        </div>

        {/* 2. Menú de Navegación */}
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${seccionActiva === 'inventario' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('inventario')}
          >
            <span role="img" aria-label="productos">📋</span> Gestión de Productos
          </button>

          <button 
            className={`sidebar-nav-item ${seccionActiva === 'categorias' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('categorias')}
          >
            <span role="img" aria-label="categorias">🏷️</span> Gestión de Categorías
          </button>

          <button 
            className={`sidebar-nav-item ${seccionActiva === 'marcas' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('marcas')}
          >
            <span role="img" aria-label="marcas">👟</span> Gestión de Marcas
          </button>
        </nav>
        
        {/* 3. Footer y Logout */}
        <div className="sidebar-footer">
            <button 
                className="sidebar-logout-btn" 
                onClick={handleLogout}
            >
                <span role="img" aria-label="door">🚪</span> Cerrar Sesión
            </button>
        </div>

    </div>
  );
}

export default SidebarAlmacen;