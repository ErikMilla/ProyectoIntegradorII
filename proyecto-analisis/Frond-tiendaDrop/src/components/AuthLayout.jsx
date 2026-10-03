import { useState } from 'react';
import { BrandMark } from './Brand';
import Icon from './Icon';
import '../css/Auth.css';

const BENEFICIOS = [
  ['receipt', 'Sigue tus pedidos', 'Revisa cada compra con sus tallas y la dirección de entrega.'],
  ['bag', 'Paga más rápido', 'Tus datos de envío se completan solos en el checkout.'],
  ['badge', 'Opina sobre tus pares', 'Deja reseñas y ayuda a otros a elegir su talla.'],
];

/** Marco común de inicio de sesión y registro. */
function AuthLayout({ children, ancho = false }) {
  return (
    <div className="auth">
      <div className={`auth-main${ancho ? ' auth-main--wide' : ''}`}>{children}</div>
      <aside className="auth-aside" aria-label="Beneficios de tener una cuenta">
        <BrandMark className="auth-aside-mark" label={null} />
        <h2 className="display">Tu cuenta Drop</h2>
        <ul>
          {BENEFICIOS.map(([icono, titulo, texto]) => (
            <li key={titulo}>
              <Icon name={icono} size={24} />
              <span><strong>{titulo}</strong>{texto}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

/** Campo de contraseña con botón para mostrarla mientras se escribe. */
export function CampoClave({ id, label, ayuda, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input id={id} className="input" type={visible ? 'text' : 'password'} aria-describedby={ayuda ? `${id}-ayuda` : undefined} {...props} />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-controls={id}>
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {ayuda && <small id={`${id}-ayuda`}>{ayuda}</small>}
    </div>
  );
}

/** Paso de verificación por código de 6 dígitos (login con MFA y registro). */
export function FormularioCodigo({ correo, codigo, setCodigo, codigoDesarrollo, procesando, onSubmit, textoBoton, acciones }) {
  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <p className="auth-lead">
        Enviamos un código de 6 dígitos a <strong>{correo}</strong>. Caduca en 5 minutos.
      </p>
      <div className="field">
        <label htmlFor="auth-code">Código de verificación</label>
        <input
          id="auth-code"
          className="input auth-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength="6"
          pattern="[0-9]{6}"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
          required
        />
      </div>
      {codigoDesarrollo && (
        <p className="auth-dev" role="status">Código de prueba (solo en local): <strong>{codigoDesarrollo}</strong></p>
      )}
      <button className="btn btn--primary btn--block" type="submit" disabled={procesando}>{textoBoton}</button>
      <div className="auth-secondary">{acciones}</div>
    </form>
  );
}

export default AuthLayout;
