import React from 'react';
import { useCart } from './CartContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

// Estilos para la página del carrito (CSS-in-JS)
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
    cartLayout: {
        display: 'flex',
        flexDirection: 'row',
        gap: '30px'
    },
    itemsList: {
        flex: 2, // Ocupa 2/3 del espacio
    },
    summary: {
        flex: 1, // Ocupa 1/3 del espacio
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        height: 'fit-content' // Para que no se estire
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
    emptyCart: {
        textAlign: 'center',
        padding: '50px'
    },
    continueShoppingBtn: {
        padding: '10px 20px',
        backgroundColor: '#3498db',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        fontSize: '1rem'
    },
    cartItem: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px'
    },
    itemImage: {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '8px',
        marginRight: '20px'
    },
    itemDetails: {
        flex: 1
    },
    itemName: {
        fontSize: '1.2rem',
        fontWeight: 'bold'
    },
    itemPrice: {
        fontSize: '1rem',
        color: '#555',
        margin: '5px 0'
    },
    itemQuantity: {
        fontSize: '0.9rem'
    },
    removeItemBtn: {
        padding: '5px 10px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    }
};


function CartPage() {
    // 1. Obtener datos de los Contextos
    const { cartItems, cartTotal, removeItem, clearCart } = useCart();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // 2. Definir costos fijos y calcular totales
    const COSTO_ENVIO = 17.00;
    const PORCENTAJE_IGV = 0.18; // 18%

    const subtotal = cartTotal;
    const igv = subtotal * PORCENTAJE_IGV;
    const totalFinal = subtotal + igv + COSTO_ENVIO;

    // 3. Manejar el clic en "Pagar"
    const handleCheckout = () => {
        if (currentUser) {
            // Si el usuario está logueado, lo llevamos a la página de pago
            console.log("Usuario logueado, yendo a pagar...");
            navigate('/proceso-pago'); // (Crearemos esta página después)
        } else {
            // Si no está logueado, lo mandamos al login
            console.log("Usuario no logueado, mandando a /login");
            navigate('/login');
        }
    };

    // 4. Renderizar un mensaje si el carrito está vacío
    if (cartItems.length === 0) {
        return (
            <div style={styles.container}>
                <div style={styles.emptyCart}>
                    <h1 style={styles.title}>Tu carrito está vacío</h1>
                    <p style={{ marginBottom: '30px' }}>Parece que aún no has agregado productos.</p>
                    <Link to="/catalogo" style={styles.continueShoppingBtn}>
                        Ir a la tienda
                    </Link>
                </div>
            </div>
        );
    }

    // 5. Renderizar el carrito si tiene productos
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Mi Carrito</h1>
            <div style={styles.cartLayout}>

                {/* Columna Izquierda: Lista de Productos */}
                <div style={styles.itemsList}>
                    {cartItems.map(item => (
                        <div key={item.id} style={styles.cartItem}>
                            <img 
                                src={`http://localhost:8081${item.foto}`} 
                                alt={item.nombre} 
                                style={styles.itemImage}
                            />
                            <div style={styles.itemDetails}>
                                <span style={styles.itemName}>{item.nombre}</span>
                                <p style={styles.itemPrice}>S/ {item.prcio_venta.toFixed(2)}</p>
                                <p style={styles.itemQuantity}>Cantidad: {item.quantity}</p>
                            </div>
                            <button 
                                onClick={() => removeItem(item.id)}
                                style={styles.removeItemBtn}
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={clearCart} 
                        style={{ ...styles.removeItemBtn, backgroundColor: '#f39c12', marginTop: '20px' }}
                    >
                        Vaciar Carrito
                    </button>
                </div>

                {/* Columna Derecha: Resumen de Pago */}
                <div style={styles.summary}>
                    <h2 style={styles.summaryTitle}>Resumen del Pedido</h2>
                    <div style={styles.summaryRow}>
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
                    <button onClick={handleCheckout} style={styles.payButton}>
                        {currentUser ? 'Ir a Pagar' : 'Iniciar Sesión para Pagar'}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default CartPage;