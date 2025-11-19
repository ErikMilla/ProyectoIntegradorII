import React, { useState } from 'react';
import SidebarVendedor from '../../components/vendedor/SidebarVendedor';
import HistorialVentas from '../../components/vendedor/HistorialVentas';
import POS from '../../components/vendedor/POS'; 

// Reutilizamos el CSS de la intranet que ya tienes
import '../../css/Intranet.css';

function IntranetVendedor() {
  // Estado para controlar qué vista se muestra (POS por defecto)
  const [seccionActiva, setSeccionActiva] = useState('pos'); 

  const renderContent = () => {
    switch (seccionActiva) {
      case 'pos':
        return (
          <div>
            <h1 style={{marginBottom: '20px'}}>Terminal de Venta (POS)</h1>
            <POS />
          </div>
        );
      case 'historial':
        return (
          <div>
            <h1>Historial de Ventas</h1>
           <HistorialVentas />
          </div>
        );
      default:
        return <div>Selecciona una opción del menú.</div>;
    }
  };

  return (
    <div className="intranet-layout">
      {/* 1. Sidebar Específico de Vendedor */}
      <SidebarVendedor 
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
      />

      {/* 2. Área de Contenido Principal */}
      <div className="intranet-content" style={{backgroundColor: '#f4f6f8', minHeight: '100vh'}}>
        {renderContent()}
      </div>
    </div>
  );
}

export default IntranetVendedor;