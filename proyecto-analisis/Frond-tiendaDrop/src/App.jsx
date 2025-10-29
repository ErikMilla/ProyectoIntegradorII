// src/App.jsx (CÓDIGO CORREGIDO)
// ** Importar useLocation para usarlo en AppContent **
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Registro from './pages/Registro';
import Home from './pages/Home';
import Navbar from './components/Navbar';

import IntranetAdmin from './pages/intranet/Admin';
import IntranetAlmacen from './pages/intranet/Almacen';
import IntranetVendedor from './pages/intranet/Vendedor';

// El componente principal que aplica la lógica condicional al Navbar
function AppContent() {
  // Obtenemos la ruta actual
  const location = useLocation();
  
  // Condición: TRUE si la ruta comienza con '/intranet-'
  const isIntranet = location.pathname.startsWith('/intranet-'); 

  return (
    <div className="App">
      
      {/* Condición: SOLO renderiza el Navbar si NO es una intranet */}
      {!isIntranet && <Navbar />} 

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Intranets por rol - CON GUION */}
        <Route path="/intranet-admin" element={<IntranetAdmin />} />
        <Route path="/intranet-almacen" element={<IntranetAlmacen />} />
        <Route path="/intranet-vendedor" element={<IntranetVendedor />} />
      </Routes>
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