import React, { useState, useEffect } from 'react';
import InventoryService from '../../services/inventory.service';
import { agruparPorProducto } from '../../utils/productGrouping';

function ReporteInventario() {
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        InventoryService.getAllProductos()
            .then(res => {
                const agrupados = agruparPorProducto(res.data);
                setProductos(agrupados);
            })
            .catch(err => console.error(err));
    }, []);

    // Calcular valor total del inventario (Costo * Stock)
    const valorInventario = productos.reduce((total, p) => {
        const stockTotalProducto = p.variantes.reduce((acc, v) => acc + v.stock, 0);
        return total + (stockTotalProducto * p.precio_compra);
    }, 0);

    return (
        <div>
            <div style={{backgroundColor:'#f1c40f', padding:'15px', marginBottom:'20px', borderRadius:'5px', fontWeight:'bold'}}>
                💰 Valorización del Inventario (Costo): S/ {valorInventario.toFixed(2)}
            </div>

            <table style={{width:'100%', borderCollapse:'collapse', backgroundColor:'white'}}>
                <thead style={{backgroundColor:'#e67e22', color:'white'}}>
                    <tr>
                        <th style={{padding:'10px'}}>Producto</th>
                        <th style={{padding:'10px'}}>Modelo</th>
                        <th style={{padding:'10px'}}>Costo Unit.</th>
                        <th style={{padding:'10px'}}>P. Venta</th>
                        <th style={{padding:'10px'}}>Stock Total</th>
                        <th style={{padding:'10px'}}>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {productos.map(p => {
                        const stockTotal = p.variantes.reduce((acc, v) => acc + v.stock, 0);
                        const stockCritico = stockTotal < 5;
                        
                        return (
                            <tr key={p.id} style={{borderBottom:'1px solid #ddd', textAlign:'center'}}>
                                <td style={{padding:'10px', textAlign:'left'}}>{p.nombre}</td>
                                <td style={{padding:'10px'}}>{p.modelo}</td>
                                <td style={{padding:'10px'}}>S/ {p.precio_compra.toFixed(2)}</td>
                                <td style={{padding:'10px'}}>S/ {p.prcio_venta.toFixed(2)}</td>
                                <td style={{padding:'10px', fontWeight:'bold'}}>{stockTotal}</td>
                                <td style={{padding:'10px'}}>
                                    {stockCritico ? 
                                        <span style={{color:'red', fontWeight:'bold'}}>⚠ Bajo Stock</span> : 
                                        <span style={{color:'green'}}>✔ OK</span>
                                    }
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default ReporteInventario;