import React, { useState, useEffect } from 'react';
import VentaService from '../../services/venta.service';

function ReporteVentas() {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        VentaService.getAllVentas()
            .then(res => {
                setVentas(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Calculo de ingresos totales
    const totalIngresos = ventas.reduce((acc, v) => acc + v.total, 0);

    return (
        <div className="report-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h3>Reporte General de Ventas</h3>
                <div style={{padding:'15px', backgroundColor:'#2ecc71', color:'white', borderRadius:'8px'}}>
                    <strong>Ingresos Totales: </strong> S/ {totalIngresos.toFixed(2)}
                </div>
            </div>

            {loading ? <p>Cargando datos...</p> : (
                <table style={{width:'100%', borderCollapse:'collapse', backgroundColor:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                    <thead style={{backgroundColor:'#f8f9fa'}}>
                        <tr>
                            <th style={{padding:'12px', textAlign:'left'}}>ID</th>
                            <th style={{padding:'12px', textAlign:'left'}}>Fecha</th>
                            <th style={{padding:'12px', textAlign:'left'}}>Cliente</th>
                            <th style={{padding:'12px', textAlign:'left'}}>Método Pago</th>
                            <th style={{padding:'12px', textAlign:'right'}}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventas.map(venta => (
                            <tr key={venta.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:'12px'}}>#{venta.id}</td>
                                <td style={{padding:'12px'}}>{new Date(venta.fecha).toLocaleDateString()}</td>
                                <td style={{padding:'12px'}}>
                                    {venta.usuario ? `${venta.usuario.nombre} ${venta.usuario.apellido}` : 'Desconocido'}
                                </td>
                                <td style={{padding:'12px'}}>{venta.metodo_venta || venta.metodo_pago}</td>
                                <td style={{padding:'12px', textAlign:'right', fontWeight:'bold'}}>S/ {venta.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ReporteVentas;