import React, { useState } from 'react';
import SidebarAlmacen from '../../components/almacen/SidebarAlmacen';
import InventarioManagement from '../../components/almacen/InventarioManagement'; // Asumimos que es el formulario para NUEVO
import CategoriaManagement from '../../components/almacen/CategoriaManagement';
import MarcaManagement from '../../components/almacen/MarcaManagement';
import ProductList from '../../components/almacen/ProductList';
import ProductForm from '../../components/almacen/ProductForm'; // 👈 Usaremos este para la EDICIÓN


// Asegúrate de importar tu CSS aquí (ejemplo de nombre)
import '../../css/intranet.css';

function IntranetAlmacen() {
  const [seccionActiva, setSeccionActiva] = useState('inventario');
  // 🚨 1. Nuevo estado para guardar el ID del producto que se va a editar
  const [productoIdAEditar, setProductoIdAEditar] = useState(null); 

  // 🚨 2. Función unificada para gestionar el cambio de vista y el ID
  const handleViewChange = (newView, productId = null) => {
    setProductoIdAEditar(productId);
    setSeccionActiva(newView);
  };

  const renderContent = () => {
    // ------------------------------------------
    // VISTA DE EDICIÓN: 'editar'
    // ------------------------------------------
    if (seccionActiva === 'editar' && productoIdAEditar) {
      return (
        <ProductForm 
          productId={productoIdAEditar}
          // Cuando se guarda o cancela, volvemos a la lista ('inventario')
          onFinish={() => handleViewChange('inventario')} 
        />
      );
    }
    
    // ------------------------------------------
    // OTRAS VISTAS (Lista, Nuevo, Categorías, Marcas)
    // ------------------------------------------
    switch (seccionActiva) {
      case 'inventario':
        return (
            <ProductList 
                // onNew cambia a 'NuevoProducto'
                onNew={() => handleViewChange('NuevoProducto')} 
                // 🚨 onEdit cambia a 'editar' y pasa el ID del producto
                onEdit={(id) => handleViewChange('editar', id)}
            />
        );
      case 'categorias':
        return <CategoriaManagement />;
      case 'marcas':
        return <MarcaManagement />;
      case 'NuevoProducto':
        // Asumiendo que InventarioManagement es el formulario de registro (nuevo)
        return (
            <InventarioManagement 
                 // Asumimos que InventarioManagement tiene un onFinish para volver a la lista
                 onFinish={() => handleViewChange('inventario')}
            />
        );
      default:
        return <div>Selecciona una opción del menú.</div>;
    }
  };

  return (
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