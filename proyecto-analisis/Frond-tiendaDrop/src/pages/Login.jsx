import React, { useState } from 'react';
import AuthService from '../services/auth.service.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');

  // 3. Traemos la función 'login' del contexto
  const { login } = useAuth();

  const handleLogin = async (e) => { // 4. Hacemos la función async
    e.preventDefault();
    setMensaje('');

    if (!correo || !contraseña) {
      setMensaje('El correo y la contraseña son obligatorios.');
      return;
    }

    // 5. LLAMAMOS A LA FUNCIÓN DEL CONTEXTO
    const credentials = { correo, contraseña };
    const result = await login(credentials);

    // 6. Si el login falló, el contexto nos devuelve el error
    if (!result.success) {
      setMensaje(result.error);
    }
    // (Si el login tuvo éxito, el AuthContext ya se encargó de redirigir)
  };
  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          style={{
            display: 'block',
            margin: '10px 0',
            padding: '8px',
            width: '100%',
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
          style={{
            display: 'block',
            margin: '10px 0',
            padding: '8px',
            width: '100%',
          }}
        />
        <button
          type="submit"
          style={{ padding: '10px 20px', marginTop: '10px' }}
        >
          Iniciar Sesión
        </button>
      </form>
      {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}
      <p>
        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
      </p>
    </div>
  );
}

export default Login;