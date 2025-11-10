import React, { createContext, useContext, useState, useEffect } from 'react';
// 1. CREAMOS Y EXPORTAMOS EL CONTEXTO DIRECTAMENTE
export const CartContext = createContext();

// 2. EL 'useCart' (que daba error) SE ELIMINA DE AQUÍ

// 3. EL PROVIDER QUEDA CASI IGUAL
export const CartProvider = ({ children }) => {
    
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localCart = window.localStorage.getItem('dropstore_cart');
            return localCart ? JSON.parse(localCart) : [];
        } catch (error) {
            return [];
        }
    });

    useEffect(() => {
        window.localStorage.setItem('dropstore_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Lógica de 'addItem' (está correcta como la hicimos)
    const addItem = (productoMaestro, varianteSeleccionada) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.varianteId === varianteSeleccionada.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.varianteId === varianteSeleccionada.id
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            } else {
                const newItem = {
                    id: productoMaestro.id,
                    varianteId: varianteSeleccionada.id,
                    nombre: productoMaestro.nombre,
                    foto: productoMaestro.foto,
                    prcio_venta: productoMaestro.prcio_venta,
                    talla: varianteSeleccionada.talla,
                    stock: varianteSeleccionada.stock,
                    quantity: 1
                };
                return [...prevItems, newItem];
            }
        });
    };

    const removeItem = (varianteId) => {
        setCartItems(prevItems => 
            prevItems.filter(item => item.varianteId !== varianteId)
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cartItems.reduce((total, item) => total + (item.prcio_venta * item.quantity), 0);

    const value = {
        cartItems,
        addItem,
        removeItem,
        clearCart,
        itemCount,
        cartTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart debe ser usado dentro de un CartProvider');
    }
    return context;
};