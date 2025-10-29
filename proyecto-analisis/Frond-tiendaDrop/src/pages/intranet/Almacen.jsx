// Frond-tiendaDrop/src/pages/intranet/Almacen.jsx (MODIFICADO COMPLETAMENTE)

import React, { useState } from 'react';
// Importar los nuevos componentes
import SidebarAlmacen from '../../components/almacen/SidebarAlmacen'; 
import CategoriaManagement from '../../components/almacen/CategoriaManagement';
import MarcaManagement from '../../components/almacen/MarcaManagement';
import InventarioManagement from '../../components/almacen/InventarioManagement';

export default function IntranetAlmacen() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Estado para controlar qué sección está activa
  const [seccionActiva, setSeccionActiva] = useState('inventario');

  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'categorias':
        return <CategoriaManagement />;
      case 'marcas':
        return <MarcaManagement />;
      case 'inventario':
      default:
        return <InventarioManagement />;
    }
  };

  return (
    <div className="intranet-layout">
      {/* 1. Menú Lateral */}
      <SidebarAlmacen 
        seccionActiva={seccionActiva} 
        setSeccionActiva={setSeccionActiva} 
      />
      
      {/* 2. Contenido Principal */}
      <div className="intranet-content">
        <h1>Intranet Almacén - Control de Catálogo</h1>
        <p>
            Bienvenido, **{user.nombre} {user.apellido}** | Rol: **{user.rol}**
        </p>
        
        {/* Renderiza el componente de gestión activo */}
        <div style={{ marginTop: '30px' }}>
          {renderSeccion()}
        </div>
      </div>
    </div>
  );
}