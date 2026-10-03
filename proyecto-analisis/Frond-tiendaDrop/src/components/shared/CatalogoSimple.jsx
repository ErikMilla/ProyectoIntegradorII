import { useState } from 'react';
import { mensajeDeError } from '../../services/api';

/**
 * Lista + formulario para catalogos que solo tienen nombre: Marcas y Categorias.
 * Se reutiliza para los dos porque la pantalla es identica.
 */
function CatalogoSimple({ titulo, ejemplo, items, onCrear, onActualizar, onEliminar, onCambio }) {
  const [nombre, setNombre] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const enMinuscula = titulo.toLowerCase();

  const guardar = async (evento) => {
    evento.preventDefault();
    if (!nombre.trim()) return;
    try {
      if (editandoId) await onActualizar(editandoId, nombre.trim());
      else await onCrear(nombre.trim());
      setNombre('');
      setEditandoId(null);
      await onCambio();
      setMensaje(`${titulo} guardada correctamente.`);
    } catch (error) {
      setMensaje(mensajeDeError(error, `No se pudo guardar. Verifica que la ${enMinuscula} no esté repetida.`));
    }
  };

  const eliminar = async (item) => {
    if (!window.confirm(`¿Eliminar ${item.nombre}?`)) return;
    try {
      await onEliminar(item.id);
      await onCambio();
      setMensaje(`${titulo} eliminada.`);
    } catch {
      setMensaje('No se puede eliminar porque algún producto la está usando.');
    }
  };

  const cancelar = () => {
    setEditandoId(null);
    setNombre('');
  };

  return (
    <div className="catalog-editor">
      <div className="data-card">
        <header className="card-heading">
          <h2>{titulo}s registradas</h2>
          <span>{items.length} registros</span>
        </header>

        {items.length === 0 ? (
          <div className="empty-state">
            <strong>No hay {enMinuscula}s</strong>
            <span>Crea la primera para habilitar el formulario de productos.</span>
          </div>
        ) : (
          <ul className="catalog-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.nombre}</strong>
                  <small>ID {item.id}</small>
                </span>
                <div className="row-actions">
                  <button onClick={() => { setEditandoId(item.id); setNombre(item.nombre); }}>Editar</button>
                  <button className="danger" onClick={() => eliminar(item)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="editor-card compact-editor" onSubmit={guardar}>
        <div className="editor-heading">
          <div>
            <p>{editandoId ? 'EDICIÓN' : 'NUEVO REGISTRO'}</p>
            <h2>{editandoId ? `Editar ${enMinuscula}` : `Nueva ${enMinuscula}`}</h2>
          </div>
        </div>

        <label>
          Nombre
          <input
            required
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder={`Ej. ${ejemplo}`}
          />
        </label>

        <button className="primary-button" type="submit">
          {editandoId ? 'Guardar cambios' : `Crear ${enMinuscula}`}
        </button>

        {editandoId && (
          <button className="secondary-button" type="button" onClick={cancelar}>Cancelar</button>
        )}

        {mensaje && <small className="form-feedback">{mensaje}</small>}
      </form>
    </div>
  );
}

export default CatalogoSimple;
