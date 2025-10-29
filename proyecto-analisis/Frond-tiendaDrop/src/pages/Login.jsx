import React, { useState } from 'react';
import AuthService from '../services/auth.service.js';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setMensaje('');

    console.log('=== DEBUG LOGIN ===');
    console.log('Correo state:', correo);
    console.log('Contraseña state:', contraseña);

    if (!correo || !contraseña) {
      setMensaje('El correo y la contraseña son obligatorios.');
      return;
    }

    const credentials = { correo, contraseña };
    console.log('Credentials a enviar:', credentials);

    AuthService.login(credentials)
      .then((res) => {
        console.log('Login exitoso:', res.data);
        const user = res.data;
        localStorage.setItem('user', JSON.stringify(user));

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
            navigate('/');
        }
      })
      .catch((error) => {
        console.error('Error de login completo:', error);
        console.error('Error response:', error.response);
        setMensaje(
          error.response?.data?.error ||
            'Error al iniciar sesión. Verifica tus credenciales.'
        );
      });
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