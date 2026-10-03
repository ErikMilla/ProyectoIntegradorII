import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/auth';
import UserService from '../../services/user.service';
import { mensajeDeError } from '../../services/api';
import UserForm from './UserForm';

const ROLES = ['CLIENTE', 'ADMIN', 'ALMACENERO', 'VENDEDOR'];
const USUARIO_VACIO = {
  nombre: '', apellido: '', correo: '', dni: '', telefono: '', direccion: '', rol: 'CLIENTE', contraseña: '',
};

const usuarioParaFormulario = (usuario) => ({
  ...USUARIO_VACIO,
  nombre: usuario?.nombre || '',
  apellido: usuario?.apellido || '',
  correo: usuario?.correo || '',
  dni: usuario?.dni || '',
  telefono: usuario?.telefono || '',
  direccion: usuario?.direccion || '',
  rol: usuario?.rol || 'CLIENTE',
});

function UserManagement() {
  const { currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(usuarioParaFormulario());

  const cargar = async () => {
    setCargando(true);
    try {
      const respuesta = await UserService.getAll();
      setUsuarios(respuesta.data || []);
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudieron cargar los usuarios.'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setFormulario(usuarioParaFormulario());
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      if (editandoId) await UserService.update(editandoId, formulario);
      else await UserService.create(formulario);
      limpiarFormulario();
      await cargar();
      setMensaje(editandoId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo guardar el usuario.'));
    } finally {
      setGuardando(false);
    }
  };

  const editar = (usuario) => {
    setEditandoId(usuario.id);
    setFormulario(usuarioParaFormulario(usuario));
    setMensaje('');
  };

  const cambiarRol = async (usuario, rol) => {
    try {
      await UserService.update(usuario.id, { ...usuario, rol, contraseña: '' });
      await cargar();
      setMensaje(`Rol de ${usuario.nombre} actualizado a ${rol}.`);
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo actualizar el rol.'));
    }
  };

  const eliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await UserService.remove(usuario.id);
      if (editandoId === usuario.id) limpiarFormulario();
      await cargar();
      setMensaje('Usuario eliminado correctamente.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo eliminar el usuario. Puede tener ventas asociadas.'));
    }
  };

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter((usuario) => (
      `${usuario.nombre} ${usuario.apellido} ${usuario.correo} ${usuario.rol}`
        .toLowerCase()
        .includes(termino)
    ));
  }, [usuarios, busqueda]);

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Usuarios</h1>
        </div>
        <div className="module-actions">
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar usuario"
            />
          </label>
          <button className="primary-button" type="button" onClick={limpiarFormulario}>+ Nuevo usuario</button>
        </div>
      </header>

      {mensaje && <div className="admin-notice" role="status">{mensaje}</div>}

      <div className="split-management">
        <div className="data-card">
          {cargando ? (
            <div className="empty-state">Cargando usuarios…</div>
          ) : visibles.length === 0 ? (
            <div className="empty-state"><strong>No hay usuarios</strong><span>Crea el primero con el formulario.</span></div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr><th>Usuario</th><th>Correo</th><th>DNI</th><th>Rol</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {visibles.map((usuario) => {
                    const esCuentaActual = currentUser?.id === usuario.id;
                    return (
                      <tr key={usuario.id}>
                        <td>
                          <strong>{usuario.nombre} {usuario.apellido}</strong>
                          <small>#{usuario.id}{esCuentaActual ? ' · Tu cuenta' : ''}</small>
                        </td>
                        <td>{usuario.correo}</td>
                        <td>{usuario.dni || '—'}</td>
                        <td>
                          <select
                            aria-label={`Rol de ${usuario.nombre}`}
                            className="role-select"
                            value={usuario.rol}
                            disabled={esCuentaActual}
                            onChange={(evento) => cambiarRol(usuario, evento.target.value)}
                          >
                            {ROLES.map((rol) => <option key={rol}>{rol}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button type="button" onClick={() => editar(usuario)}>Editar</button>
                            <button
                              type="button"
                              className="danger"
                              disabled={esCuentaActual}
                              title={esCuentaActual ? 'No puedes eliminar la cuenta que estás usando' : 'Eliminar usuario'}
                              onClick={() => eliminar(usuario)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <UserForm
          formulario={formulario}
          editando={Boolean(editandoId)}
          guardando={guardando}
          rolBloqueado={editandoId === currentUser?.id}
          onChange={setFormulario}
          onSubmit={guardar}
          onCancel={limpiarFormulario}
        />
      </div>
    </section>
  );
}

export default UserManagement;
