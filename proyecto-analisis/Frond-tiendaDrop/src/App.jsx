import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Registro from './pages/Registro';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Nosotros from './pages/Nosotros';
import DetalleProducto from './pages/DetalleProducto';
import CartPage from './pages/CartPage.jsx';
import ProcesoPago from './pages/ProcesoPago.jsx';
import OrdenConfirmada from './pages/OrdenConfirmada.jsx';
import MisPedidos from './pages/MisPedidos.jsx';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RutaProtegida from './components/RutaProtegida.jsx';

// Intranet: una pantalla por rol.
import IntranetAdmin from './pages/intranet/Admin';
import IntranetAlmacen from './pages/intranet/Almacen';
import IntranetVendedor from './pages/intranet/Vendedor';

import { CartProvider } from './pages/CartContext.jsx';
import { AuthProvider } from './pages/AuthContext.jsx';

/**
 * Las pantallas de la intranet traen su propio menu lateral, por eso ahi no se
 * muestran la barra superior ni el pie de pagina de la tienda.
 */
function AppContent() {
  const location = useLocation();
  const esIntranet = location.pathname.startsWith('/intranet-');

  // Al cambiar de página se vuelve arriba, como en una navegación normal
  // (salvo que el enlace apunte a una sección, p. ej. /nosotros#envios).
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="App">
      {!esIntranet && <Navbar />}

      <main id="contenido" tabIndex={-1}>
        <Routes>
          {/* --- Tienda publica --- */}
          <Route path="/" element={<Home />} />
          <Route path="/catalogo/:genero?" element={<Catalogo />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/carrito" element={<CartPage />} />

          {/* --- Compra: requiere haber iniciado sesion --- */}
          <Route
            path="/proceso-pago"
            element={<RutaProtegida><ProcesoPago /></RutaProtegida>}
          />
          <Route
            path="/orden-confirmada"
            element={<RutaProtegida><OrdenConfirmada /></RutaProtegida>}
          />
          <Route
            path="/mis-pedidos"
            element={<RutaProtegida><MisPedidos /></RutaProtegida>}
          />

          {/* --- Intranet: cada panel exige su rol --- */}
          <Route
            path="/intranet-admin"
            element={<RutaProtegida roles={['ADMIN']}><IntranetAdmin /></RutaProtegida>}
          />
          <Route
            path="/intranet-almacen"
            element={<RutaProtegida roles={['ADMIN', 'ALMACENERO']}><IntranetAlmacen /></RutaProtegida>}
          />
          <Route
            path="/intranet-vendedor"
            element={<RutaProtegida roles={['ADMIN', 'VENDEDOR']}><IntranetVendedor /></RutaProtegida>}
          />
        </Routes>
      </main>

      {!esIntranet && <Footer />}
    </div>
  );
}

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
