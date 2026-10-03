function UserForm({ formulario, editando, guardando, rolBloqueado, onChange, onSubmit, onCancel }) {
  const campo = (nombre) => ({
    value: formulario[nombre],
    onChange: (evento) => onChange({ ...formulario, [nombre]: evento.target.value }),
  });

  return (
    <form className="editor-card" onSubmit={onSubmit}>
      <div className="editor-heading">
        <div>
          <p>{editando ? 'EDICIÓN' : 'NUEVO REGISTRO'}</p>
          <h2>{editando ? 'Editar usuario' : 'Crear usuario'}</h2>
        </div>
        {editando && (
          <button type="button" className="text-button" onClick={onCancel}>Cancelar</button>
        )}
      </div>

      <div className="field-grid">
        <label>Nombres<input required maxLength="80" {...campo('nombre')} /></label>
        <label>Apellidos<input maxLength="80" {...campo('apellido')} /></label>
        <label className="full-field">
          Correo
          <input required type="email" autoComplete="off" {...campo('correo')} />
        </label>
        <label>DNI<input maxLength="20" {...campo('dni')} /></label>
        <label>Teléfono<input maxLength="20" {...campo('telefono')} /></label>
        <label className="full-field">Dirección<input maxLength="160" {...campo('direccion')} /></label>
        <label className="full-field">
          Rol
          <select disabled={rolBloqueado} {...campo('rol')}>
            <option value="CLIENTE">Cliente</option>
            <option value="VENDEDOR">Vendedor</option>
            <option value="ALMACENERO">Almacenero</option>
            <option value="ADMIN">Administrador</option>
          </select>
          {rolBloqueado && <small>Tu propia cuenta debe conservar el rol de administrador.</small>}
        </label>
        <label className="full-field">
          {editando ? 'Nueva clave (opcional)' : 'Clave temporal'}
          <input
            type="password"
            required={!editando}
            minLength="12"
            autoComplete="new-password"
            placeholder={editando ? 'Déjala vacía para conservar la actual' : 'Mínimo 12 caracteres'}
            {...campo('contraseña')}
          />
        </label>
      </div>

      <p className="form-feedback">
        {editando
          ? 'La clave solo cambiará si escribes una nueva.'
          : 'Entrega la clave temporal de forma privada. El sistema la guarda protegida.'}
      </p>
      <button className="primary-button full-button" type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
      </button>
    </form>
  );
}

export default UserForm;
