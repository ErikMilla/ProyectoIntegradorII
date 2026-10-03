import { useState } from 'react';
import BarraLateral from '../../components/shared/BarraLateral';
import PuntoDeVenta from '../../components/shared/PuntoDeVenta';
import HistorialVentas from '../../components/shared/HistorialVentas';
import ClientManagement from '../../components/admin/ClientManagement';
import '../../css/Intranet.css';

const MENU = [
  ['pos', 'register', 'Nueva venta'],
  ['clientes', 'user', 'Clientes'],
  ['historial', 'history', 'Historial'],
];

/**
 * Panel del vendedor: cobra en tienda, administra la cartera de clientes y
 * revisa lo vendido.
 *
 * El módulo de clientes es el mismo del panel de administración. El vendedor lo
 * necesita porque es quien atiende en mostrador y da de alta a quien compra por
 * primera vez. Si está en medio de una venta, el carrito no se pierde al salir
 * a esta sección: el POS lo conserva.
 */
function IntranetVendedor() {
  const [seccion, setSeccion] = useState('pos');

  const secciones = {
    pos: <PuntoDeVenta onVentaRegistrada={() => setSeccion('historial')} />,
    clientes: <ClientManagement />,
    historial: <HistorialVentas />,
  };

  return (
    <div className="backoffice-layout">
      <BarraLateral
        titulo="Ventas"
        opciones={MENU}
        seccionActiva={seccion}
        setSeccionActiva={setSeccion}
      />
      <main className="backoffice-content">
        {secciones[seccion] || secciones.pos}
      </main>
    </div>
  );
}

export default IntranetVendedor;
