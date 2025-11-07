import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Registro from './pages/Registro';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo'; // 👈 1. IMPORTAR Catalogo.jsx

import Navbar from './components/Navbar'; // Modificado
import Footer from './components/Footer';

// Rutas de Intranet
import IntranetAdmin from './pages/intranet/Admin';
import IntranetAlmacen from './pages/intranet/Almacen';
import IntranetVendedor from './pages/intranet/Vendedor';

function AppContent() {
    const location = useLocation();
    
    // Condición: TRUE si la ruta comienza con '/intranet-'
    const isIntranet = location.pathname.startsWith('/intranet-'); 
    
    // Opcional: TRUE si la ruta es /login o /registro
    const isAuthPage = location.pathname === '/login' || location.pathname === '/registro';

    return (
        <div className="App">
            
            {/* 1. Navbar se oculta si es Intranet */}
            {!isIntranet && <Navbar />} 

            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    
                    {/* 2. RUTA DEL CATÁLOGO: Acepta /catalogo, /catalogo/Mujer, /catalogo/Hombre */}
                    <Route path="/catalogo/:genero?" element={<Catalogo />} /> 
                    
                    {/* Rutas de Autenticación */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                    
                    {/* Rutas de Intranet */}
                    <Route path="/intranet-admin" element={<IntranetAdmin />} />
                    <Route path="/intranet-almacen" element={<IntranetAlmacen />} />
                    <Route path="/intranet-vendedor" element={<IntranetVendedor />} />
                </Routes>
            </main>

            {/* 3. Footer se oculta si es Intranet */}
            {!isIntranet && <Footer />}
            
        </div>
    );
}

// La función principal App solo envuelve AppContent en el Router
function App() {
    return (
        <Router>
            <AppContent /> 
        </Router>
    );
}

export default App;