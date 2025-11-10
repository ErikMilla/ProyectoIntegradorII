import React, { useState } from 'react';
import { useCart } from './CartContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// --- (Los estilos 'styles' van aquí. Son los mismos de antes) ---
// (No los pego para no hacer la respuesta tan larga, 
//  usa los mismos estilos 'styles' de la respuesta anterior)
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    title: {
        fontSize: '2rem',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '10px',
        marginBottom: '30px'
    },
    checkoutLayout: {
        display: 'flex',
        flexDirection: 'row',
        gap: '30px',
        flexWrap: 'wrap' // Para mejor responsividad
    },
    formColumn: {
        flex: 2, // Columna de formulario
        minWidth: '300px', // Ancho mínimo
    },
    summaryColumn: {
        flex: 1, // Columna de resumen
        minWidth: '300px', // Ancho mínimo
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        height: 'fit-content'
    },
    formSection: {
        marginBottom: '25px'
    },
    formLabel: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    },
    formInput: {
        width: '100%',
        padding: '12px',
        fontSize: '1rem',
        border: '1px solid #ddd',
        borderRadius: '5px',
        boxSizing: 'border-box'
    },
    summaryTitle: {
        fontSize: '1.5rem',
        marginBottom: '20px'
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '15px',
        fontSize: '1rem'
    },
    summaryTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '2px solid #ddd',
        fontSize: '1.2rem',
        fontWeight: 'bold'
    },
    payButton: {
        width: '100%',
        padding: '15px',
        fontSize: '1.1rem',
        backgroundColor: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '20px'
    },
    // Nuevos estilos para los métodos de pago
    paymentMethod: {
        display: 'flex',
        gap: '15px',
        marginBottom: '20px'
    },
    paymentOption: {
        flex: 1,
        padding: '15px',
        border: '2px solid #ddd',
        borderRadius: '5px',
        cursor: 'pointer',
        textAlign: 'center'
    },
    paymentOptionSelected: {
        borderColor: '#3498db',
        backgroundColor: '#f0f8ff'
    },
    yapeQr: {
        textAlign: 'center',
        padding: '20px',
        border: '1px dashed #ccc',
        borderRadius: '5px'
    }
};


function ProcesoPago() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // 1. REQUERIMIENTO: Auto-relleno desde currentUser
    // Asumimos que tu currentUser tiene 'nombre', 'email', 'telefono' y 'direccion'
    // Si no los tiene, usará un string vacío ('').
    const [formData, setFormData] = useState({
        nombre: currentUser ? (currentUser.nombre || '') : '',
        email: currentUser ? (currentUser.email || '') : '',
        direccion: currentUser ? (currentUser.direccion || '') : '',
        telefono: currentUser ? (currentUser.telefono || '') : '',
    });

    // 2. REQUERIMIENTO: Métodos de Pago (Tarjeta o Yape/Plin)
    const [metodoPago, setMetodoPago] = useState('tarjeta'); // 'tarjeta' o 'yape'
    
    // Estado para los campos simulados de tarjeta
    const [cardData, setCardData] = useState({
        numero: '',
        fecha: '',
        cvv: ''
    });

    // --- Calculos de Total (sin cambios) ---
    const COSTO_ENVIO = 17.00;
    const PORCENTAJE_IGV = 0.18;
    const subtotal = cartTotal;
    const igv = subtotal * PORCENTAJE_IGV;
    const totalFinal = subtotal + igv + COSTO_ENVIO;

    // --- Manejadores (Handlers) ---
    
    // Este manejador permite que los campos sean EDITABLES
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Manejador para los campos de tarjeta
    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Manejador para el envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        
        console.log("--- ORDEN ENVIADA (SIMULACIÓN) ---");
        console.log("Datos de Envío:", formData);
        console.log("Método de Pago:", metodoPago);
        
        if (metodoPago === 'tarjeta') {
            console.log("Datos Tarjeta (Simulado):", cardData);
        }

        console.log("Items:", cartItems);
        console.log("Total Pagado:", totalFinal.toFixed(2));
        
        // alert("¡Gracias por tu compra!");
        clearCart();
        navigate('/orden-confirmada');
    };

    if (cartItems.length === 0) {
        navigate('/cart');
        return null;
    }

    // --- Renderizado del Componente ---
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Proceso de Pago</h1>
            
            <form onSubmit={handleSubmit}>
                <div style={styles.checkoutLayout}>
                
                    {/* Columna Izquierda: Formulario de Envío y Pago */}
                    <div style={styles.formColumn}>
                        
                        {/* --- SECCIÓN DATOS DE ENVÍO --- */}
                        <div style={styles.formSection}>
                            <h2>1. Datos de Contacto y Envío</h2>
                            
                            <label style={styles.formLabel} htmlFor="nombre">Nombre Completo</label>
                            <input style={styles.formInput} type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        
                        <div style={styles.formSection}>
                            <label style={styles.formLabel} htmlFor="email">Email</label>
                            <input style={styles.formInput} type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>

                        <div style={styles.formSection}>
                            <label style={styles.formLabel} htmlFor="direccion">Dirección de Envío</label>
                            <input style={styles.formInput} type="text" id="direccion" name="direccion" value={formData.direccion} onChange={handleInputChange} placeholder="Ej: Av. Principal 123" required />
                        </div>

                        <div style={styles.formSection}>
                            <label style={styles.formLabel} htmlFor="telefono">Teléfono</label>
                            <input style={styles.formInput} type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Ej: 987654321" required />
                        </div>

                        {/* --- SECCIÓN MÉTODO DE PAGO --- */}
                        <div style={styles.formSection}>
                            <h2>2. Método de Pago</h2>
                            <div style={styles.paymentMethod}>
                                <div 
                                    style={{ ...styles.paymentOption, ...(metodoPago === 'tarjeta' ? styles.paymentOptionSelected : {}) }}
                                    onClick={() => setMetodoPago('tarjeta')}
                                >
                                    💳 Tarjeta
                                </div>
                                <div 
                                    style={{ ...styles.paymentOption, ...(metodoPago === 'yape' ? styles.paymentOptionSelected : {}) }}
                                    onClick={() => setMetodoPago('yape')}
                                >
                                    <span style={{color: '#800080', fontWeight: 'bold'}}>Yape</span> / <span style={{color: '#0070f3', fontWeight: 'bold'}}>Plin</span>
                                </div>
                            </div>
                        </div>

                        {/* --- CAMPOS CONDICIONALES DE PAGO --- */}
                        
                        {/* Si es TARJETA, mostrar campos de tarjeta */}
                        {metodoPago === 'tarjeta' && (
                            <div style={styles.formSection}>
                                <h3>Datos de la Tarjeta (Simulación)</h3>
                                <label style={styles.formLabel} htmlFor="numero">Número de Tarjeta</label>
                                <input style={styles.formInput} type="text" id="numero" name="numero" value={cardData.numero} onChange={handleCardChange} placeholder="4555 1234 5678 9012" required />
                                
                                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.formLabel} htmlFor="fecha">Fecha Venc. (MM/AA)</label>
                                        <input style={styles.formInput} type="text" id="fecha" name="fecha" value={cardData.fecha} onChange={handleCardChange} placeholder="12/28" required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.formLabel} htmlFor="cvv">CVV</label>
                                        <input style={styles.formInput} type="text" id="cvv" name="cvv" value={cardData.cvv} onChange={handleCardChange} placeholder="123" required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Si es YAPE/PLIN, mostrar un QR simulado */}
                        {metodoPago === 'yape' && (
                            <div style={styles.formSection}>
                                <h3>Pagar con Yape / Plin</h3>
                                <div style={styles.yapeQr}>
                                    
                                    <p style={{ margin: '15px 0 0 0' }}>
                                        Al confirmar, simularemos el pago. En un app real, aquí escanearías el QR o te llegaría una solicitud.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Columna Derecha: Resumen del Pedido (Sin cambios) */}
                    <div style={styles.summaryColumn}>
                        <h2 style={styles.summaryTitle}>Resumen del Pedido</h2>
                        
                        {cartItems.map(item => (
                            <div key={item.varianteId} style={styles.summaryRow}>
                                <span style={{maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{item.nombre} (x{item.quantity})</span>
                                <span>S/ {(item.prcio_venta * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}

                        <div style={{...styles.summaryRow, marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px'}}>
                            <span>Subtotal:</span>
                            <span>S/ {subtotal.toFixed(2)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>Envío:</span>
                            <span>S/ {COSTO_ENVIO.toFixed(2)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>IGV (18%):</span>
                            <span>S/ {igv.toFixed(2)}</span>
                        </div>
                        <div style={styles.summaryTotal}>
                            <span>Total:</span>
                            <span>S/ {totalFinal.toFixed(2)}</span>
                        </div>

                        {/* El botón de pago ahora es tipo "submit" para el formulario */}
                        <button type="submit" style={styles.payButton}>
                            Confirmar Pedido y Pagar
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}

export default ProcesoPago;