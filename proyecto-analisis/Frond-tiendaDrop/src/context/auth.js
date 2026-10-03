import { createContext, useContext } from 'react';

/** Contexto con la sesion activa. El proveedor vive en pages/AuthContext.jsx */
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
