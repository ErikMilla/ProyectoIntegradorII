import { createContext, useContext } from 'react';

/** Contexto del carrito. El proveedor vive en pages/CartContext.jsx */
export const CartContext = createContext(null);

export const useCart = () => {
  const contexto = useContext(CartContext);
  if (!contexto) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return contexto;
};
