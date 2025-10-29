import React, { useState } from 'react';
import AuthService from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

function Registro() {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    correo: '',
    contraseña: '',
    confirmarContraseña: '',
    telefono: '',
    direccion: '',
  });
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = (e) => {
    e.preventDefault();
    setMensaje('');

    if (formData.contraseña !== formData.confirmarContraseña) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    const userDataToSend = {
      dni: formData.dni,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      contraseña: formData.contraseña,
      confircontraseña: formData.confirmarContraseña,
      telefono: formData.telefono,
      direccion: formData.direccion,
    };

    AuthService.register(userDataToSend)
      .then(() => {
        setMensaje('Registro exitoso. Serás redirigido al login.');
        setTimeout(() => navigate('/login'), 1500);
      })
      .catch((error) => {
        setMensaje(error.response?.data?.error || 'Error al registrar. Verifica los datos.');
      });
  };

  return (
    <div style={{ padding: '50px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          name="dni"
          placeholder="DNI"
          value={formData.dni}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="text"
          name="apellido"
          placeholder="Apellido"
          value={formData.apellido}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo"
          value={formData.correo}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="password"
          name="contraseña"
          placeholder="Contraseña"
          value={formData.contraseña}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="password"
          name="confirmarContraseña"
          placeholder="Confirmar Contraseña"
          value={formData.confirmarContraseña}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={formData.direccion}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>
          Registrarme
        </button>
      </form>
      {mensaje && <p style={{ color: mensaje.includes('exitoso') ? 'green' : 'red' }}>{mensaje}</p>}
      <p>
        ¿Ya tienes cuenta? <a href="/login">Inicia Sesión</a>
      </p>
    </div>
  );
}

export default Registro;