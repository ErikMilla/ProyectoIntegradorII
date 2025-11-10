// src/App.jsx

import React from 'react'; // <-- Importante: Asegúrate que React esté importado
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
// LA FUNCIÓN AppContent NO CAMBIA NADA
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
                    <Route path="/carrito" element={<CartPage />} />
                    <Route path="/intranet-admin" element={<IntranetAdmin />} />
                    <Route path="/intranet-almacen" element={<IntranetAlmacen />} />
                    <Route path="/intranet-vendedor" element={<IntranetVendedor />} />
                </Routes>
            </main>
            {!isIntranet && <Footer />}
        </div>
    );
}

// AQUÍ ESTÁ EL CAMBIO IMPORTANTE
function App() {
    return (
        // 1. El <Router> DEBE ir AFUERA de todo
        <Router>
            {/* 2. Los Providers van ADENTRO del Router */}
            <AuthProvider>
                <CartProvider>
                    {/* 3. AppContent ahora hereda todo */}
                    <AppContent />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;