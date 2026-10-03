import { useState } from 'react';
import BarraLateral from '../../components/shared/BarraLateral';
import GestionInventario from '../../components/shared/GestionInventario';
import PuntoDeVenta from '../../components/shared/PuntoDeVenta';
import Reportes from '../../components/shared/Reportes';
import DashboardOverview from '../../components/admin/DashboardOverview';
import UserManagement from '../../components/admin/UserManagement';
import InvoiceManagement from '../../components/admin/InvoiceManagement';
import ClientManagement from '../../components/admin/ClientManagement';
import Configuracion from '../../components/admin/Configuracion';
import ContenidoTienda from '../../components/admin/ContenidoTienda';
import '../../css/Intranet.css';

const MENU = [
  ['dashboard', 'grid', 'Resumen'],
  ['usuarios', 'users', 'Usuarios'],
  ['facturacion', 'receipt', 'Facturación'],
  ['inventario', 'box', 'Inventario'],
  ['clientes', 'user', 'Clientes'],
  ['pos', 'register', 'Punto de venta'],
  ['reportes', 'chart', 'Reportes'],
  ['contenido', 'image', 'Contenido web'],
  ['configuracion', 'settings', 'Configuración'],
];

/** Panel del administrador: tiene acceso a todos los modulos. */
function IntranetAdmin() {
  const [seccion, setSeccion] = useState('dashboard');

  const secciones = {
    dashboard: <DashboardOverview onNavigate={setSeccion} />,
    usuarios: <UserManagement />,
    facturacion: <InvoiceManagement onCreateSale={() => setSeccion('pos')} />,
    inventario: <GestionInventario />,
    clientes: <ClientManagement />,
    pos: <PuntoDeVenta onVentaRegistrada={() => setSeccion('facturacion')} />,
    reportes: <Reportes />,
    contenido: <ContenidoTienda />,
    configuracion: <Configuracion />,
  };

  return (
    <div className="backoffice-layout">
      <BarraLateral
        titulo="Administración"
        opciones={MENU}
        seccionActiva={seccion}
        setSeccionActiva={setSeccion}
      />
      <main className="backoffice-content">
        {secciones[seccion] || secciones.dashboard}
      </main>
    </div>
  );
}

export default IntranetAdmin;
