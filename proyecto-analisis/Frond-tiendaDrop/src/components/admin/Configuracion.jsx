import { useState } from 'react';

/**
 * Preferencias de la tienda. Se guardan en el navegador (localStorage), asi que
 * son locales a cada equipo; no viajan al servidor.
 */
function Configuracion() {
  const [nombreTienda, setNombreTienda] = useState(() => localStorage.getItem('dropStoreName') || 'DROP Store');
  const [contacto, setContacto] = useState(() => localStorage.getItem('dropStoreContact') || 'contacto@dropstore.local');
  const [mensaje, setMensaje] = useState('');

  const guardar = (evento) => {
    evento.preventDefault();
    localStorage.setItem('dropStoreName', nombreTienda);
    localStorage.setItem('dropStoreContact', contacto);
    setMensaje('Configuración guardada en este equipo.');
  };

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Configuración</h1>
        </div>
      </header>

      <form className="editor-card settings-editor" onSubmit={guardar}>
        <label>
          Nombre de la tienda
          <input required value={nombreTienda} onChange={(evento) => setNombreTienda(evento.target.value)} />
        </label>

        <label>
          Correo de contacto
          <input required type="email" value={contacto} onChange={(evento) => setContacto(evento.target.value)} />
        </label>

        <button className="primary-button" type="submit">Guardar cambios</button>

        {mensaje && <small className="form-feedback">{mensaje}</small>}
      </form>
    </section>
  );
}

export default Configuracion;
