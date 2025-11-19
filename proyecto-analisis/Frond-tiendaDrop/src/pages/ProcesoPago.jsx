import React, { useState } from 'react';
import { useCart } from './CartContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import VentaService from '../services/venta.service'; // 1. Importamos el servicio

// ... (Mantén tus estilos 'styles' aquí tal cual estaban, no los borres) ...
const styles = {
    container: { maxWidth: '1200px', margin: '40px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    title: { fontSize: '2rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', marginBottom: '30px' },
    checkoutLayout: { display: 'flex', flexDirection: 'row', gap: '30px', flexWrap: 'wrap' },
    formColumn: { flex: 2, minWidth: '300px' },
    summaryColumn: { flex: 1, minWidth: '300px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', height: 'fit-content' },
    formSection: { marginBottom: '25px' },
    formLabel: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' },
    formInput: { width: '100%', padding: '12px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' },
    summaryTitle: { fontSize: '1.5rem', marginBottom: '20px' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1rem' },
    summaryTotal: { display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #ddd', fontSize: '1.2rem', fontWeight: 'bold' },
    payButton: { width: '100%', padding: '15px', fontSize: '1.1rem', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' },
    paymentMethod: { display: 'flex', gap: '15px', marginBottom: '20px' },
    paymentOption: { flex: 1, padding: '15px', border: '2px solid #ddd', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' },
    paymentOptionSelected: { borderColor: '#3498db', backgroundColor: '#f0f8ff' },
    yapeQr: { textAlign: 'center', padding: '20px', border: '1px dashed #ccc', borderRadius: '5px' }
};

function ProcesoPago() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    // Estado para controlar carga y errores
    const [procesando, setProcesando] = useState(false);

    const [formData, setFormData] = useState({
        nombre: currentUser ? (currentUser.nombre || '') : '',
        email: currentUser ? (currentUser.correo || '') : '', // Ojo: tu usuario usa 'correo', no 'email'
        direccion: currentUser ? (currentUser.direccion || '') : '',
        telefono: currentUser ? (currentUser.telefono || '') : '',
    });

    const [metodoPago, setMetodoPago] = useState('tarjeta');
    
    const [cardData, setCardData] = useState({ numero: '', fecha: '', cvv: '' });

    // Cálculos
    const COSTO_ENVIO = 17.00;
    const PORCENTAJE_IGV = 0.18;
    const subtotal = cartTotal;
    const igv = subtotal * PORCENTAJE_IGV;
    const totalFinal = subtotal + igv + COSTO_ENVIO;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    // --- 2. FUNCIÓN DE ENVÍO REAL ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser || !currentUser.id) {
            alert("Error: No se identifica al usuario logueado.");
            return;
        }

        setProcesando(true);

        // A. Construir el JSON exacto que pide tu Backend (VentaRequestDto)
        const ventaDto = {
            usuarioId: currentUser.id,
            metodoPago: metodoPago,
            subtotal: subtotal,
            costoEnvio: COSTO_ENVIO,
            igv: igv,
            total: totalFinal,
            // Datos del cliente (ClienteDto)
            cliente: {
                nombre: formData.nombre,
                email: formData.email,
                direccion: formData.direccion,
                telefono: formData.telefono
            },
            // Items del carrito (List<DetalleVentaRequestDto>)
            items: cartItems.map(item => ({
                detalleProductoId: item.varianteId, // El ID de la variante específica (talla)
                cantidad: item.quantity,
                precioUnitario: item.prcio_venta
            }))
        };

        try {
            // B. Enviar al Backend
            console.log("Enviando venta:", ventaDto);
            await VentaService.crearVenta(ventaDto);

            // C. Éxito
            clearCart();
            navigate('/orden-confirmada');

        } catch (error) {
            console.error("Error al procesar la venta:", error);
            // Mostrar mensaje de error del backend si existe (ej: "Stock insuficiente")
            const errorMsg = error.response?.data?.message || "Ocurrió un error al procesar el pago.";
            alert("Error: " + errorMsg);
        } finally {
            setProcesando(false);
        }
    };

    if (cartItems.length === 0) {
        navigate('/carrito');
        return null;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Proceso de Pago</h1>
            
            <form onSubmit={handleSubmit}>
                <div style={styles.checkoutLayout}>
                    {/* Columna Izquierda (Formulario) */}
                    <div style={styles.formColumn}>
                        {/* ... (Los inputs de Nombre, Email, Dirección, Teléfono se mantienen igual) ... */}
                         <div style={styles.formSection}>
                            <h2>1. Datos de Contacto y Envío</h2>
                            <label style={styles.formLabel}>Nombre Completo</label>
                            <input style={styles.formInput} type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        <div style={styles.formSection}>
                            <label style={styles.formLabel}>Email</label>
                            <input style={styles.formInput} type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        <div style={styles.formSection}>
                            <label style={styles.formLabel}>Dirección de Envío</label>
                            <input style={styles.formInput} type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} required />
                        </div>
                        <div style={styles.formSection}>
                            <label style={styles.formLabel}>Teléfono</label>
                            <input style={styles.formInput} type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} required />
                        </div>

                        {/* ... (Sección Método de Pago se mantiene igual) ... */}
                        <div style={styles.formSection}>
                            <h2>2. Método de Pago</h2>
                            <div style={styles.paymentMethod}>
                                <div style={{ ...styles.paymentOption, ...(metodoPago === 'tarjeta' ? styles.paymentOptionSelected : {}) }} onClick={() => setMetodoPago('tarjeta')}>
                                    💳 Tarjeta
                                </div>
                                <div style={{ ...styles.paymentOption, ...(metodoPago === 'yape' ? styles.paymentOptionSelected : {}) }} onClick={() => setMetodoPago('yape')}>
                                    📱 Yape / Plin
                                </div>
                            </div>
                        </div>

                         {/* Inputs Condicionales de Pago (Solo visuales por ahora) */}
                         {metodoPago === 'tarjeta' && (
                            <div style={styles.formSection}>
                                <label style={styles.formLabel}>Número de Tarjeta</label>
                                <input style={styles.formInput} type="text" name="numero" value={cardData.numero} onChange={handleCardChange} maxLength="19" placeholder="0000 0000 0000 0000" required />
                                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                    <input style={styles.formInput} type="text" name="fecha" placeholder="MM/AA" required />
                                    <input style={styles.formInput} type="text" name="cvv" placeholder="CVV" required />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna Derecha (Resumen) */}
                    <div style={styles.summaryColumn}>
                        <h2 style={styles.summaryTitle}>Resumen del Pedido</h2>
                        {cartItems.map(item => (
                            <div key={item.varianteId} style={styles.summaryRow}>
                                <span style={{maxWidth:'180px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'}}>
                                    {item.nombre} <small>({item.talla})</small> x{item.quantity}
                                </span>
                                <span>S/ {(item.prcio_venta * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <hr style={{border:'0', borderTop:'1px solid #eee', margin:'15px 0'}}/>
                        <div style={styles.summaryRow}><span>Subtotal:</span><span>S/ {subtotal.toFixed(2)}</span></div>
                        <div style={styles.summaryRow}><span>Envío:</span><span>S/ {COSTO_ENVIO.toFixed(2)}</span></div>
                        <div style={styles.summaryRow}><span>IGV (18%):</span><span>S/ {igv.toFixed(2)}</span></div>
                        <div style={styles.summaryTotal}><span>Total:</span><span>S/ {totalFinal.toFixed(2)}</span></div>

                        {/* Botón de Pagar */}
                        <button type="submit" style={{...styles.payButton, backgroundColor: procesando ? '#95a5a6' : '#2ecc71'}} disabled={procesando}>
                            {procesando ? 'Procesando...' : 'Confirmar Pedido y Pagar'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ProcesoPago;