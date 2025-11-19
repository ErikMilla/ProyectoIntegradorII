import React, { useState } from 'react';
import SidebarAdmin from '../../components/admin/SidebarAdmin';
import ReporteVentas from '../../components/admin/ReporteVentas';
import ReporteInventario from '../../components/admin/ReporteInventario';
import ReporteClientes from '../../components/admin/ReporteClientes';

// Reutilizamos los estilos
import '../../css/Intranet.css';

function IntranetAdmin() {
  const [seccionActiva, setSeccionActiva] = useState('dashboard');

  const renderContent = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return (
            <div style={{textAlign:'center', marginTop:'50px'}}>
                <h1>Bienvenido al Panel Administrativo</h1>
                <p>Selecciona un reporte en el menú lateral para visualizar la información.</p>
                <div style={{display:'flex', gap:'20px', justifyContent:'center', marginTop:'30px'}}>
                    <div style={{padding:'20px', background:'white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)', borderRadius:'8px'}}>
                        <h3>Reportes en Tiempo Real</h3>
                        <p>Visualiza ventas y stock al instante.</p>
                    </div>
                    <div style={{padding:'20px', background:'white', boxShadow:'0 2px 5px rgba(0,0,0,0.1)', borderRadius:'8px'}}>
                        <h3>Gestión de Clientes</h3>
                        <p>Accede a la base de datos de usuarios.</p>
                    </div>
                </div>
            </div>
        );
      case 'ventas':
        return <ReporteVentas />;
      case 'inventario':
        return <ReporteInventario />;
      case 'clientes':
        return <ReporteClientes />;
      default:
        return <div>Opción no válida</div>;
    }
  };

  return (
    <div className="intranet-layout">
      {/* Sidebar Específico de Admin */}
      <SidebarAdmin 
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
      />

      {/* Contenido Dinámico */}
      <div className="intranet-content" style={{backgroundColor: '#f4f6f8', minHeight:'100vh'}}>
        {renderContent()}
      </div>
    </div>
  );
}

export default IntranetAdmin;