import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import '../css/Auth.css';

function AuthBrand() {
  return (
    <div className="auth-brand" aria-label="Drop Store">
      <span className="nav-logo"><span className="brand-mark" aria-hidden="true">▶</span><span>DROP</span></span>
    </div>
  );
}

function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { login } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMensaje('');

    if (!correo || !contraseña) {
      setMensaje('El correo y la contraseña son obligatorios.');
      return;
    }

    const result = await login({ correo, contraseña });
    if (!result.success) setMensaje(result.error);
  };

  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-card">
        <div className="auth-form-panel">
          <h1 id="login-title">Iniciar sesión</h1>
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-email">Correo</label>
              <input id="login-email" type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} autoComplete="email" required />
            </div>
            <div className="auth-field">
              <label htmlFor="login-password">Clave</label>
              <input id="login-password" type="password" value={contraseña} onChange={(event) => setContraseña(event.target.value)} autoComplete="current-password" required />
            </div>
            <button className="auth-submit" type="submit">Iniciar</button>
          </form>
          {mensaje && <p className="auth-feedback" role="alert">{mensaje}</p>}
          <p className="auth-switch">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
        </div>

        <aside className="auth-welcome-panel">
          <AuthBrand />
          <h2>¡Hola y<br />bienvenido!</h2>
          <p>Regístrate con tu información personal para disfrutar de todas las características de nuestro sitio.</p>
          <Link to="/registro" className="auth-outline-link">Únete</Link>
        </aside>
      </div>
    </section>
  );
}

export default Login;
