import React, { useState, useEffect } from 'react';
import VentaService from '../../services/venta.service';
import AuthService from '../../services/auth.service';

function HistorialVentas() {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistorial = async () => {
            const currentUser = AuthService.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                setError('No se pudo identificar al usuario.');
                setCargando(false);
                return;
            }

            try {
                // Llamada al servicio (Asegúrate de que venta.service.js tenga getHistorial)
                const res = await VentaService.getHistorial(currentUser.id);
                setVentas(res.data || []);
            } catch (err) {
                console.error("Error al cargar historial:", err);
                if (err.response && (err.response.status === 404 || err.response.status === 204)) {
                    setVentas([]); // No es error, solo que no hay datos
                } else {
                    setError('Hubo un problema al cargar el historial.');
                }
            } finally {
                setCargando(false);
            }
        };

        fetchHistorial();
    }, []);

    if (cargando) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando historial...</div>;

    return (
        <div className="historial-container" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px', color: '#2c3e50' }}>
                📜 Historial de Transacciones
            </h2>
            
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            
            {!cargando && !error && ventas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>Aún no has realizado ninguna venta.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>ID Venta</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Fecha</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Método Pago</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>Total (S/)</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'center' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map((venta) => (
                                <tr key={venta.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#555' }}>#{venta.id}</td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(venta.fecha).toLocaleDateString()} <small style={{color:'#888'}}>{new Date(venta.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            backgroundColor: venta.metodo_pago === 'Efectivo' ? '#e2e3e5' : '#cce5ff',
                                            color: venta.metodo_pago === 'Efectivo' ? '#333' : '#004085',
                                            fontSize: '0.85em',
                                            fontWeight: '500'
                                        }}>
                                            {venta.metodo_pago || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                                        S/ {venta.total ? venta.total.toFixed(2) : '0.00'}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9em' }}>✔ Completada</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default HistorialVentas;