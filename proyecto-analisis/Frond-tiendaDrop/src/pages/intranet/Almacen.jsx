import { useState } from 'react';
import BarraLateral from '../../components/shared/BarraLateral';
import AlertasStock from '../../components/shared/AlertasStock';
import GestionInventario from '../../components/shared/GestionInventario';
import Reportes from '../../components/shared/Reportes';
import '../../css/Intranet.css';

const MENU = [
  ['alertas', 'alert', 'Alertas'],
  ['inventario', 'box', 'Inventario'],
  ['reportes', 'chart', 'Reportes'],
];

/**
 * Panel del almacenero: controla el catalogo y el stock.
 *
 * Usa exactamente el mismo componente de inventario que el administrador. Antes
 * existia una copia aparte (InventarioManagement + ProductForm + ProductList)
 * que se habia ido desincronizando de la version del panel admin.
 *
 * Entra directo a Alertas: es lo primero que necesita saber al llegar, no algo
 * que tenga que ir a buscar al dashboard del administrador (al que no tiene
 * acceso).
 */
function IntranetAlmacen() {
  const [seccion, setSeccion] = useState('alertas');

  const secciones = {
    alertas: <AlertasStock onNavigate={setSeccion} />,
    inventario: <GestionInventario />,
    reportes: <Reportes />,
  };

  return (
    <div className="backoffice-layout">
      <BarraLateral
        titulo="Almacén"
        opciones={MENU}
        seccionActiva={seccion}
        setSeccionActiva={setSeccion}
      />
      <main className="backoffice-content">
        {secciones[seccion] || secciones.alertas}
      </main>
    </div>
  );
}

export default IntranetAlmacen;
