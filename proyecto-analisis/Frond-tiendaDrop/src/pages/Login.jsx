import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import AuthLayout, { CampoClave, FormularioCodigo } from '../components/AuthLayout';

function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const { login, verifyMfa, resendMfa } = useAuth();
  const location = useLocation();

  const vieneDelCarrito = location.state?.destino === '/carrito';

  const handleLogin = async (event) => {
    event.preventDefault();
    setMensaje(null);

    if (!correo || !contraseña) {
      setMensaje({ tipo: 'error', texto: 'Escribe tu correo y tu contraseña.' });
      return;
    }

    setProcesando(true);
    const result = await login({ correo, contraseña });
    setProcesando(false);
    if (!result.success) {
      setMensaje({ tipo: 'error', texto: result.error });
      return;
    }
    if (result.mfaRequired) {
      setChallenge(result.challenge);
    }
  };

  const handleMfa = async (event) => {
    event.preventDefault();
    setMensaje(null);
    if (!/^\d{6}$/.test(codigo)) {
      setMensaje({ tipo: 'error', texto: 'El código tiene 6 dígitos.' });
      return;
    }
    setProcesando(true);
    const result = await verifyMfa({ challengeId: challenge.challengeId, codigo });
    setProcesando(false);
    if (!result.success) setMensaje({ tipo: 'error', texto: result.error });
  };

  const handleReenvio = async () => {
    setMensaje(null);
    setProcesando(true);
    const result = await resendMfa(challenge.challengeId);
    setProcesando(false);
    if (!result.success) {
      setMensaje({ tipo: 'error', texto: result.error });
      return;
    }
    setChallenge({ ...challenge, ...result.data });
    setCodigo('');
    setMensaje({ tipo: 'ok', texto: 'Te enviamos un código nuevo.' });
  };

  const volverAlLogin = () => {
    setChallenge(null);
    setCodigo('');
    setMensaje(null);
  };

  return (
    <AuthLayout>
      <h1 className="page-title">{challenge ? 'Revisa tu correo' : 'Inicia sesión'}</h1>
      {!challenge && (
        <p className="auth-lead">
          {vieneDelCarrito ? 'Inicia sesión para terminar tu compra. Tu carrito se mantiene.' : 'Entra con el correo de tu cuenta Drop.'}
        </p>
      )}

      {challenge ? (
        <FormularioCodigo
          correo={challenge.correoEnmascarado}
          codigo={codigo}
          setCodigo={setCodigo}
          codigoDesarrollo={challenge.codigoDesarrollo}
          procesando={procesando}
          onSubmit={handleMfa}
          textoBoton={procesando ? 'Verificando…' : 'Verificar y entrar'}
          acciones={(
            <>
              <button type="button" onClick={handleReenvio} disabled={procesando}>Reenviar código</button>
              <button type="button" onClick={volverAlLogin} disabled={procesando}>Usar otra cuenta</button>
            </>
          )}
        />
      ) : (
        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <div className="field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input id="login-email" className="input" type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} autoComplete="email" required />
          </div>
          <CampoClave
            id="login-password"
            label="Contraseña"
            value={contraseña}
            onChange={(event) => setContraseña(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button className="btn btn--primary btn--block" type="submit" disabled={procesando}>
            {procesando ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      )}

      {mensaje && (
        <p className={`notice notice--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</p>
      )}

      {!challenge && (
        <p className="auth-switch">¿Primera vez en Drop? <Link to="/registro" state={location.state} className="link">Crea tu cuenta</Link></p>
      )}
    </AuthLayout>
  );
}

export default Login;
