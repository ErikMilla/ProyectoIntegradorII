// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Registro from './pages/Registro';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Rutas de Intranet
import IntranetAdmin from './pages/intranet/Admin';
import IntranetAlmacen from './pages/intranet/Almacen';
import IntranetVendedor from './pages/intranet/Vendedor';

import { CartProvider } from './pages/CartContext.jsx';
import { AuthProvider } from './pages/AuthContext.jsx';

import CartPage from './pages/CartPage.jsx';

// 1. IMPORTAMOS LAS NUEVAS PÁGINAS
import ProcesoPago from './pages/ProcesoPago.jsx';
import OrdenConfirmada from './pages/OrdenConfirmada.jsx';

// LA FUNCIÓN AppContent
function AppContent() {
    const location = useLocation();
    const isIntranet = location.pathname.startsWith('/intranet-');
    const isAuthPage = location.pathname === '/login' || location.pathname === '/registro';

    return (
        <div className="App">
            {!isIntranet && <Navbar />}
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalogo/:genero?" element={<Catalogo />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                    
                    {/* Tu ruta del carrito ya estaba bien */}
                    <Route path="/carrito" element={<CartPage />} /> 
                    
                    {/* 2. AÑADIMOS LAS RUTAS DE PAGO */}
                    <Route path="/proceso-pago" element={<ProcesoPago />} />
                    <Route path="/orden-confirmada" element={<OrdenConfirmada />} />

                    {/* Tus rutas de intranet */}
                    <Route path="/intranet-admin" element={<IntranetAdmin />} />
                    <Route path="/intranet-almacen" element={<IntranetAlmacen />} />
                    <Route path="/intranet-vendedor" element={<IntranetVendedor />} />
                </Routes>
            </main>
            {!isIntranet && <Footer />}
        </div>
    );
}

// El resto de tu archivo (App) está perfecto
function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;