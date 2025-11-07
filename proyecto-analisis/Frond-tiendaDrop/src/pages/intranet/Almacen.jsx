import React, { useState } from 'react';
import SidebarAlmacen from '../../components/almacen/SidebarAlmacen';
import InventarioManagement from '../../components/almacen/InventarioManagement';
import CategoriaManagement from '../../components/almacen/CategoriaManagement';
import MarcaManagement from '../../components/almacen/MarcaManagement';

// Asegúrate de importar tu CSS aquí (ejemplo de nombre)
import '../../css/intranet.css'; 

function IntranetAlmacen() {
    const [seccionActiva, setSeccionActiva] = useState('inventario');
    
    const renderContent = () => {
        switch (seccionActiva) {
            case 'inventario':
                return <InventarioManagement />;
            case 'categorias':
                return <CategoriaManagement />;
            case 'marcas':
                return <MarcaManagement />;
            default:
                return <div>Selecciona una opción del menú.</div>;
        }
    };

    return (
        // 🚨 CAMBIO CLAVE: Usamos la clase intranet-layout para el contenedor principal
        <div className="intranet-layout">
            
            {/* 1. Barra Lateral */}
            <SidebarAlmacen 
                seccionActiva={seccionActiva} 
                setSeccionActiva={setSeccionActiva} 
            />
            
            {/* 2. Contenido Principal */}
            <div className="intranet-content">
                <h1>Control de Catálogo y Logística</h1>
                <p>Bienvenido. Utiliza el menú lateral para gestionar productos, tallas y stock.</p>
                {renderContent()}
            </div>
        </div>
    );
}

export default IntranetAlmacen;