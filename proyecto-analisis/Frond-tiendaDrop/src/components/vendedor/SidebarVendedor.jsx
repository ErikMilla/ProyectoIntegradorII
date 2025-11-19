import React from 'react';
import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import '../../css/Intranet.css'; // Reutilizamos los estilos de la intranet

function SidebarVendedor({ seccionActiva, setSeccionActiva }) {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser() || { nombre: 'Vendedor' };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login'); 
  };

  return (
    <div className="sidebar">
        
        <div className="sidebar-header">
            <h2>🛒 Caja / Ventas</h2>
            <p>Vendedor: {currentUser.nombre}</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${seccionActiva === 'pos' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('pos')}
          >
            <span role="img" aria-label="pos">💻</span> Nueva Venta (POS)
          </button>

          <button 
            className={`sidebar-nav-item ${seccionActiva === 'historial' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('historial')}
          >
            <span role="img" aria-label="historial">📜</span> Historial Ventas
          </button>
        </nav>
        
        <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
                <span role="img" aria-label="door">🚪</span> Cerrar Sesión
            </button>
        </div>

    </div>
  );
}

export default SidebarVendedor;