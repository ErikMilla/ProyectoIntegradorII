import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { mensajeDeError } from '../services/api';
import AuthLayout, { CampoClave, FormularioCodigo } from '../components/AuthLayout';

function Registro() {
  const [formData, setFormData] = useState({ dni: '', nombre: '', apellido: '', correo: '', contraseña: '', confirmarContraseña: '', telefono: '', direccion: '' });
  const [mensaje, setMensaje] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

  const clavesDistintas = formData.confirmarContraseña.length > 0 && formData.contraseña !== formData.confirmarContraseña;

  const handleRegister = async (event) => {
    event.preventDefault();
    setMensaje(null);

    if (formData.contraseña.length < 12) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 12 caracteres.' });
      return;
    }
    if (formData.contraseña !== formData.confirmarContraseña) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }

    setProcesando(true);
    try {
      const { data } = await AuthService.register({
        dni: formData.dni,
        nombre: formData.nombre,
        apellido: formData.apellido,
        correo: formData.correo,
        contraseña: formData.contraseña,
        confircontraseña: formData.confirmarContraseña,
        telefono: formData.telefono,
        direccion: formData.direccion,
      });
      setChallenge(data);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeDeError(error, 'No pudimos crear la cuenta. Revisa los datos.') });
    } finally {
      setProcesando(false);
    }
  };

  const handleVerification = async (event) => {
    event.preventDefault();
    setMensaje(null);
    if (!/^\d{6}$/.test(codigo)) {
      setMensaje({ tipo: 'error', texto: 'El código tiene 6 dígitos.' });
      return;
    }
    setProcesando(true);
    try {
      await AuthService.verificarRegistro({ challengeId: challenge.challengeId, codigo });
      setMensaje({ tipo: 'ok', texto: 'Cuenta creada. Te llevamos a iniciar sesión…' });
      setTimeout(() => navigate('/login'), 1400);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeDeError(error, 'No pudimos verificar el código.') });
    } finally {
      setProcesando(false);
    }
  };

  const handleResend = async () => {
    setMensaje(null);
    setProcesando(true);
    try {
      const { data } = await AuthService.reenviarRegistro(challenge.challengeId);
      setChallenge({ ...challenge, ...data });
      setCodigo('');
      setMensaje({ tipo: 'ok', texto: 'Te enviamos un código nuevo.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeDeError(error, 'No pudimos reenviar el código.') });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <AuthLayout ancho={!challenge}>
      <h1 className="page-title">{challenge ? 'Confirma tu correo' : 'Crea tu cuenta'}</h1>
      {!challenge && <p className="auth-lead">Usaremos estos datos para tus boletas y entregas.</p>}

      {challenge ? (
        <FormularioCodigo
          correo={challenge.correoEnmascarado}
          codigo={codigo}
          setCodigo={setCodigo}
          codigoDesarrollo={challenge.codigoDesarrollo}
          procesando={procesando}
          onSubmit={handleVerification}
          textoBoton={procesando ? 'Verificando…' : 'Crear mi cuenta'}
          acciones={(
            <>
              <button type="button" onClick={handleResend} disabled={procesando}>Reenviar código</button>
              <button type="button" onClick={() => { setChallenge(null); setMensaje(null); }} disabled={procesando}>Corregir mis datos</button>
            </>
          )}
        />
      ) : (
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-grid">
            <div className="field"><label htmlFor="register-name">Nombre</label><input id="register-name" className="input" name="nombre" value={formData.nombre} onChange={handleChange} autoComplete="given-name" required /></div>
            <div className="field"><label htmlFor="register-lastname">Apellido</label><input id="register-lastname" className="input" name="apellido" value={formData.apellido} onChange={handleChange} autoComplete="family-name" required /></div>
            <div className="field auth-grid-wide"><label htmlFor="register-email">Correo electrónico</label><input id="register-email" className="input" name="correo" type="email" value={formData.correo} onChange={handleChange} autoComplete="email" required /></div>
            <div className="field"><label htmlFor="register-dni">DNI</label><input id="register-dni" className="input" name="dni" value={formData.dni} onChange={handleChange} inputMode="numeric" required /></div>
            <div className="field"><label htmlFor="register-phone">Celular</label><input id="register-phone" className="input" name="telefono" value={formData.telefono} onChange={handleChange} inputMode="tel" autoComplete="tel" required /></div>
            <div className="field auth-grid-wide"><label htmlFor="register-address">Dirección</label><input id="register-address" className="input" name="direccion" value={formData.direccion} onChange={handleChange} autoComplete="street-address" placeholder="Calle, número y distrito" required /></div>
            <CampoClave id="register-password" label="Contraseña" name="contraseña" minLength="12" value={formData.contraseña} onChange={handleChange} autoComplete="new-password" ayuda="Mínimo 12 caracteres." required />
            <CampoClave
              id="register-password-confirmation"
              label="Repite la contraseña"
              name="confirmarContraseña"
              minLength="12"
              value={formData.confirmarContraseña}
              onChange={handleChange}
              autoComplete="new-password"
              aria-invalid={clavesDistintas}
              ayuda={clavesDistintas ? 'No coincide con la anterior.' : undefined}
              required
            />
          </div>
          <button className="btn btn--primary btn--block" type="submit" disabled={procesando}>{procesando ? 'Enviando código…' : 'Crear cuenta'}</button>
        </form>
      )}

      {mensaje && (
        <p className={`notice notice--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</p>
      )}

      {!challenge && <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión</Link></p>}
    </AuthLayout>
  );
}

export default Registro;
