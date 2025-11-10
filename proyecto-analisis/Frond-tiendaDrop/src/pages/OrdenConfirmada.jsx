// src/pages/OrdenConfirmada.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const styles = {
    container: {
        maxWidth: '800px',
        margin: '60px auto',
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    },
    title: {
        fontSize: '2.5rem',
        color: '#2ecc71', // Verde de éxito
        marginBottom: '20px'
    },
    message: {
        fontSize: '1.2rem',
        lineHeight: '1.6',
        color: '#333',
        marginBottom: '30px'
    },
    link: {
        display: 'inline-block',
        padding: '12px 25px',
        backgroundColor: '#3498db', // Azul para "seguir"
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        fontSize: '1rem',
        fontWeight: 'bold',
        transition: 'background-color 0.3s'
    }
};

function OrdenConfirmada() {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>¡Gracias por tu compra!</h1>
            <p style={styles.message}>
                Tu pedido ha sido registrado con éxito. Recibirás un correo electrónico
                con los detalles de tu orden y la información de seguimiento pronto.
            </p>
            <Link 
                to="/catalogo" 
                style={styles.link}
                // Efecto hover simple
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
                Seguir comprando
            </Link>
        </div>
    );
}

export default OrdenConfirmada;