import { useState } from 'react';
import SidebarAdmin from '../../components/admin/SidebarAdmin';
import DashboardOverview from '../../components/admin/DashboardOverview';
import UserManagement from '../../components/admin/UserManagement';
import InvoiceManagement from '../../components/admin/InvoiceManagement';
import CatalogManagement from '../../components/admin/CatalogManagement';
import ClientManagement from '../../components/admin/ClientManagement';
import AdminPOS from '../../components/admin/AdminPOS';
import '../../css/Intranet.css';

function Settings() {
  const [storeName, setStoreName] = useState(localStorage.getItem('dropStoreName') || 'DROP Store');
  const [contact, setContact] = useState(localStorage.getItem('dropStoreContact') || 'contacto@dropstore.local');
  const [message, setMessage] = useState('');
  const save = (event) => { event.preventDefault(); localStorage.setItem('dropStoreName', storeName); localStorage.setItem('dropStoreContact', contact); setMessage('Configuración guardada en este equipo.'); };
  return <section className="admin-module"><header className="module-header"><div><p>PREFERENCIAS</p><h1>Configuración</h1></div></header><form className="editor-card settings-editor" onSubmit={save}><label>Nombre de la tienda<input required value={storeName} onChange={(event) => setStoreName(event.target.value)} /></label><label>Correo de contacto<input required type="email" value={contact} onChange={(event) => setContact(event.target.value)} /></label><button className="primary-button" type="submit">Guardar cambios</button>{message && <small className="form-feedback">{message}</small>}</form></section>;
}

function IntranetAdmin() {
  const [section, setSection] = useState('dashboard');
  const sections = {
    dashboard: <DashboardOverview onNavigate={setSection} />,
    usuarios: <UserManagement />,
    facturacion: <InvoiceManagement onCreateSale={() => setSection('pos')} />,
    inventario: <CatalogManagement />,
    clientes: <ClientManagement />,
    pos: <AdminPOS />,
    settings: <Settings />,
  };
  return <div className="backoffice-layout"><SidebarAdmin seccionActiva={section} setSeccionActiva={setSection} /><main className="backoffice-content">{sections[section] || sections.dashboard}</main></div>;
}

export default IntranetAdmin;
