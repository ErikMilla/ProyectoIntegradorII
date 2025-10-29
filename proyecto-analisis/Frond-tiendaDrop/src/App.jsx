// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Registro from './pages/Registro';
import Home from './pages/Home';
import Navbar from './components/Navbar';

import IntranetAdmin from './pages/intranet/Admin';
import IntranetAlmacen from './pages/intranet/Almacen';
import IntranetVendedor from './pages/intranet/Vendedor';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

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
    </Router>
  );
}

export default App;