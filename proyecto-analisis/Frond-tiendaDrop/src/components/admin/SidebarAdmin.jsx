import AuthService from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import dropLogo from '../../images/Logo-Drop.jpg.jpeg';

const menu = [
  ['dashboard', '▦', 'Dashboard'],
  ['usuarios', '♙', 'Usuarios'],
  ['facturacion', '$', 'Facturación'],
  ['inventario', '♧', 'Inventario'],
  ['clientes', '♧', 'Clientes'],
  ['pos', '▱', 'POS'],
];

function SidebarAdmin({ seccionActiva, setSeccionActiva }) {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const logout = () => { AuthService.logout(); navigate('/login'); };

  return <aside className="backoffice-sidebar">
    <img className="backoffice-logo" src={dropLogo} alt="DROP Store" />
    <nav aria-label="Administración">
      {menu.map(([id, icon, label]) => <button key={id} className={seccionActiva === id ? 'active' : ''} onClick={() => setSeccionActiva(id)}><i>{icon}</i>{label}</button>)}
    </nav>
    <div className="sidebar-bottom">
      <button className={seccionActiva === 'settings' ? 'active' : ''} onClick={() => setSeccionActiva('settings')}><i>⚙</i>Settings</button>
      <button onClick={logout}><i>⇥</i>Logout</button>
      <small>Sesión: {currentUser?.nombre || 'Administrador'}</small>
    </div>
  </aside>;
}

export default SidebarAdmin;
