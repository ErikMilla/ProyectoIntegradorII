import React from 'react';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

function SidebarAdmin({ seccionActiva, setSeccionActiva }) {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login'); 
  };

  return (
    <div className="sidebar" style={{backgroundColor: '#2c3e50', color: 'white'}}>
        <div className="sidebar-header">
            <h2>📊 Admin Panel</h2>
            <p>Hola, {currentUser?.nombre}</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${seccionActiva === 'dashboard' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('dashboard')}
          >
            📈 Dashboard General
          </button>

          <button 
            className={`sidebar-nav-item ${seccionActiva === 'ventas' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('ventas')}
          >
            💰 Reporte de Ventas
          </button>

          <button 
            className={`sidebar-nav-item ${seccionActiva === 'inventario' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('inventario')}
          >
            📦 Reporte Inventario
          </button>

          <button 
            className={`sidebar-nav-item ${seccionActiva === 'clientes' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('clientes')}
          >
            👥 Reporte Clientes
          </button>
        </nav>
        
        <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
                🚪 Cerrar Sesión
            </button>
        </div>
    </div>
  );
}

export default SidebarAdmin;