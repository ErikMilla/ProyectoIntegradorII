import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import '../css/Auth.css';

function AuthBrand() {
  return (
    <div className="auth-brand" aria-label="Drop Store">
      <span className="nav-logo"><span className="brand-mark" aria-hidden="true">▶</span><span>DROP</span></span>
    </div>
  );
}

function Registro() {
  const [formData, setFormData] = useState({ dni: '', nombre: '', apellido: '', correo: '', contraseña: '', confirmarContraseña: '', telefono: '', direccion: '' });
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

  const handleRegister = (event) => {
    event.preventDefault();
    setMensaje('');

    if (formData.contraseña !== formData.confirmarContraseña) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    AuthService.register({
      dni: formData.dni,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      contraseña: formData.contraseña,
      confircontraseña: formData.confirmarContraseña,
      telefono: formData.telefono,
      direccion: formData.direccion,
    })
      .then(() => {
        setMensaje('Registro exitoso. Serás redirigido al inicio de sesión.');
        setTimeout(() => navigate('/login'), 1500);
      })
      .catch((error) => setMensaje(error.response?.data?.error || 'Error al registrar. Verifica los datos.'));
  };

  return (
    <section className="auth-page" aria-labelledby="register-title">
      <div className="auth-card auth-card--register">
        <div className="auth-form-panel">
          <h1 id="register-title">Registrarse</h1>
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-fields-grid">
              <div className="auth-field"><label htmlFor="register-name">Nombre</label><input id="register-name" name="nombre" value={formData.nombre} onChange={handleChange} autoComplete="given-name" required /></div>
              <div className="auth-field"><label htmlFor="register-lastname">Apellido</label><input id="register-lastname" name="apellido" value={formData.apellido} onChange={handleChange} autoComplete="family-name" required /></div>
              <div className="auth-field auth-field--wide"><label htmlFor="register-email">Correo</label><input id="register-email" name="correo" type="email" value={formData.correo} onChange={handleChange} autoComplete="email" required /></div>
              <div className="auth-field"><label htmlFor="register-dni">DNI</label><input id="register-dni" name="dni" value={formData.dni} onChange={handleChange} inputMode="numeric" required /></div>
              <div className="auth-field"><label htmlFor="register-phone">Teléfono</label><input id="register-phone" name="telefono" value={formData.telefono} onChange={handleChange} inputMode="tel" autoComplete="tel" required /></div>
              <div className="auth-field auth-field--wide"><label htmlFor="register-address">Dirección</label><input id="register-address" name="direccion" value={formData.direccion} onChange={handleChange} autoComplete="street-address" required /></div>
              <div className="auth-field"><label htmlFor="register-password">Clave</label><input id="register-password" name="contraseña" type="password" value={formData.contraseña} onChange={handleChange} autoComplete="new-password" required /></div>
              <div className="auth-field"><label htmlFor="register-password-confirmation">Confirmar clave</label><input id="register-password-confirmation" name="confirmarContraseña" type="password" value={formData.confirmarContraseña} onChange={handleChange} autoComplete="new-password" required /></div>
            </div>
            <button className="auth-submit" type="submit">Registrarse</button>
          </form>
          {mensaje && <p className={`auth-feedback ${mensaje.includes('exitoso') ? 'auth-feedback--success' : ''}`} role="alert">{mensaje}</p>}
        </div>

        <aside className="auth-welcome-panel">
          <AuthBrand />
          <h2>¡Bienvenido!</h2>
          <p>Inicia sesión para continuar explorando las últimas novedades de Drop Store.</p>
          <Link to="/login" className="auth-outline-link">Iniciar</Link>
        </aside>
      </div>
    </section>
  );
}

export default Registro;
