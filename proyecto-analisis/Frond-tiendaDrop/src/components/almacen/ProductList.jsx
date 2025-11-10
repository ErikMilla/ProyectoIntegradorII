import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryService from '../../services/inventory.service';
import { agruparPorProducto } from '../../utils/productGrouping'; // Importamos la utilidad

// Nota: Asegúrate de tener productGrouping.js en src/utils

function ProductList({ onEdit, onNew }) { // Recibimos funciones para editar/nuevo
    const [productosMaestros, setProductosMaestros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
      const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            // Usamos el endpoint que devuelve todos los detalles (sin filtros de género/marca)
            const response = await InventoryService.getAllProductos(); 
            
            // Agrupamos los detalles en productos maestros (1 tarjeta por modelo)
            const agrupados = agruparPorProducto(response.data);
            setProductosMaestros(agrupados);
            
        } catch (err) {
            console.error("Error al cargar productos:", err);
            setError('Error al cargar la tabla de productos.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Función de Eliminación (Requiere Backend: DELETE /api/productos/{id})
    const handleDelete = async (productoId, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar el producto maestro: ${nombre}? Esto eliminará TODAS sus variantes (tallas/stock).`)) {
            try {
                // Lógica de eliminación (debes implementar el servicio)
                // await InventoryService.deleteProduct(productoId);
                alert(`Producto ${nombre} eliminado exitosamente. (Requiere implementación de DELETE en backend)`);
                fetchData(); // Recargar la lista
            } catch (error) {
                alert('Error al intentar eliminar el producto.');
                console.error(error);
            }
        }
    };
    
    if (cargando) return <div className="loading-message">Cargando inventario...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="product-list-container">
            <div className="list-header">
                <h2>Inventario Maestro ({productosMaestros.length})</h2>
                {/* Botón para redirigir al formulario de registro */}
                <button 
  className="btn-primary"
  onClick={() => onNew('NuevoProducto')} // 👈 Mandamos el valor que cambiará la vista
  style={{
      padding: '10px 20px',
      backgroundColor: '#2ecc71',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
  }}
>
  + Registrar Nuevo Producto
</button>
            </div>

            {productosMaestros.length === 0 ? (
                <p>No hay productos registrados en el inventario.</p>
            ) : (
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre/Modelo</th>
                            <th>Foto</th>
                            <th>Precio Venta</th>
                            <th>Tallas/Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosMaestros.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>
                                    <strong>{p.nombre}</strong><br/>
                                    <small>{p.modelo}</small>
                                </td>
                                <td>
                                    <img 
                                        src={`http://localhost:8081${p.foto}`} 
                                        alt={p.nombre} 
                                        style={{width: '50px', height: '50px', objectFit: 'cover'}}
                                    />
                                </td>
                                <td>S/ {p.prcio_venta.toFixed(2)}</td>
                                <td>
                                    {/* Muestra un resumen de tallas */}
                                    {p.variantes.map(v => `${v.talla} (${v.stock})`).join(', ')}
                                </td>
                                <td>
                                    <button 
                                        className="btn-edit" 
                                        onClick={() => onEdit(p.id)}
                                        style={{marginRight: '10px', padding: '5px 10px', backgroundColor: '#3498db', color: 'white', border: 'none', cursor: 'pointer'}}
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        className="btn-delete" 
                                        onClick={() => handleDelete(p.id, p.nombre)}
                                        style={{padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer'}}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ProductList;