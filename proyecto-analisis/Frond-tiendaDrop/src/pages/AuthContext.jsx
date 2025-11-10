// src/pages/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service.js'; // 1. Importa tu servicio

// Crear el contexto
const AuthContext = createContext();

// Hook para usarlo fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};

// El Proveedor
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para saber si estamos verificando al usuario
    const navigate = useNavigate();

    // 2. Efecto para cargar al usuario desde localStorage al iniciar la app
    useEffect(() => {
        try {
            const userJson = localStorage.getItem('user');
            if (userJson) {
                setCurrentUser(JSON.parse(userJson));
            }
        } catch (error) {
            console.error("Error al cargar usuario de localStorage", error);
        }
        setLoading(false); // Terminamos de verificar
    }, []);

    // 3. Función de Login (¡movemos la lógica de tu componente aquí!)
    const login = async (credentials) => {
        try {
            const res = await AuthService.login(credentials);
            const user = res.data;
            
            // Guardar en localStorage Y en el estado
            localStorage.setItem('user', JSON.stringify(user));
            setCurrentUser(user);

            // Redirigir según el rol
            switch (user.rol) {
                case 'ADMIN':
                    navigate('/intranet-admin');
                    break;
                case 'ALMACENERO':
                    navigate('/intranet-almacen');
                    break;
                case 'VENDEDOR':
                    navigate('/intranet-vendedor');
                    break;
                default:
                    // ¡Importante! Si es un cliente normal, lo mandamos al Home
                    navigate('/');
            }
            // Devolvemos éxito
            return { success: true };

        } catch (error) {
            console.error("Error en el login del AuthContext", error);
            // Devolvemos el error para que el formulario lo muestre
            return { success: false, error: error.response?.data?.error || 'Error de credenciales' };
        }
    };

    // 4. Función de Logout
    const logout = () => {
        localStorage.removeItem('user');
        setCurrentUser(null);
        navigate('/login'); // O al Home '/'
    };

    // 5. El valor que compartiremos
    const value = {
        currentUser,
        loading,
        login,
        logout
    };

    // No renderizamos nada hasta saber si el usuario está logueado o no
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};