// src/context/CartContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Crear el Contexto
const CartContext = createContext();

// 2. Hook personalizado para usar este contexto fácilmente
export const useCart = () => {
    return useContext(CartContext);
};

// 3. Crear el Proveedor (El componente que "envuelve" la app)
export const CartProvider = ({ children }) => {
    
    // 4. Estado del carrito
    // Intentamos cargar el carrito desde LocalStorage al iniciar
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localCart = window.localStorage.getItem('dropstore_cart');
            return localCart ? JSON.parse(localCart) : [];
        } catch (error) {
            console.error("Error al leer el carrito de localStorage", error);
            return [];
        }
    });

    // 5. Efecto para guardar en LocalStorage (se ejecuta CADA vez que cartItems cambia)
    useEffect(() => {
        try {
            window.localStorage.setItem('dropstore_cart', JSON.stringify(cartItems));
        } catch (error) {
            console.error("Error al guardar el carrito en localStorage", error);
        }
    }, [cartItems]);

    // --- FUNCIONES DEL CARRITO ---

    /**
     * Agrega un producto al carrito.
     * * NOTA IMPORTANTE: Por ahora, esta función agrega el "producto maestro"
     * y asume que el cliente quiere 1 unidad. Más adelante, cuando tengas
     * selección de TALLAS, tendremos que modificar esta función para
     * que acepte una TALLA específica (ej. "Nike Talla 42").
     */
    const addItem = (product) => {
        setCartItems(prevItems => {
            // 1. Buscar si el producto (por ID) ya existe
            const existingItem = prevItems.find(item => item.id === product.id);

            if (existingItem) {
                // 2. Si existe, actualiza su cantidad
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            } else {
                // 3. Si es nuevo, lo agrega al array con cantidad 1
                return [...prevItems, { ...product, quantity: 1 }];
            }
        });
        console.log("Carrito actualizado:", cartItems);
    };

    // Elimina un producto del carrito por su ID
    const removeItem = (productId) => {
        setCartItems(prevItems => 
            prevItems.filter(item => item.id !== productId)
        );
    };

    // Vacía el carrito completamente
    const clearCart = () => {
        setCartItems([]);
    };

    // --- VALORES EXPUESTOS ---

    // Calculamos valores derivados (total de items, precio total)
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cartItems.reduce((total, item) => total + (item.prcio_venta * item.quantity), 0);

    // 6. El 'value' es lo que nuestros componentes "hijos" podrán usar
    const value = {
        cartItems,      // La lista de productos
        addItem,
        removeItem,
        clearCart,
        itemCount,      // Número total de items (para el ícono del carrito)
        cartTotal       // Precio total
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};