import { useEffect, useState } from 'react';
import { CartContext } from '../context/cart';

const CLAVE_CARRITO = 'dropstore_cart';

/**
 * Carrito de compras del cliente.
 *
 * Se guarda en localStorage para que no se pierda al recargar la pagina. Cada
 * linea del carrito corresponde a una VARIANTE (un modelo en una talla
 * concreta), por eso la clave es varianteId y no el id del producto: la misma
 * zapatilla en talla 40 y en 41 son dos lineas distintas.
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_CARRITO);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(CLAVE_CARRITO, JSON.stringify(cartItems));
  }, [cartItems]);

  /**
   * Agrega una talla al carrito. La cantidad por defecto es 1 porque el
   * catalogo agrega de a uno; la ficha de producto manda la cantidad que el
   * cliente eligio con el selector.
   */
  const addItem = (productoMaestro, varianteSeleccionada, cantidad = 1) => {
    setCartItems((items) => {
      const existente = items.find((item) => item.varianteId === varianteSeleccionada.id);

      if (existente) {
        // Nunca mas unidades de las que hay en stock.
        return items.map((item) => (
          item.varianteId === varianteSeleccionada.id
            ? { ...item, quantity: Math.min(item.quantity + cantidad, varianteSeleccionada.stock) }
            : item
        ));
      }

      return [...items, {
        id: productoMaestro.id,
        varianteId: varianteSeleccionada.id,
        nombre: productoMaestro.nombre,
        foto: productoMaestro.foto,
        prcio_venta: productoMaestro.prcio_venta,
        talla: varianteSeleccionada.talla,
        stock: varianteSeleccionada.stock,
        quantity: Math.min(cantidad, varianteSeleccionada.stock),
      }];
    });
  };

  /** Cambia la cantidad de una linea ya agregada, respetando el stock. */
  const updateQuantity = (varianteId, cantidad) => {
    setCartItems((items) => items.map((item) => (
      item.varianteId === varianteId
        ? { ...item, quantity: Math.min(Math.max(1, cantidad), item.stock) }
        : item
    )));
  };

  const removeItem = (varianteId) => {
    setCartItems((items) => items.filter((item) => item.varianteId !== varianteId));
  };

  const clearCart = () => setCartItems([]);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.prcio_venta * item.quantity, 0);

  const value = { cartItems, addItem, updateQuantity, removeItem, clearCart, itemCount, cartTotal };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
