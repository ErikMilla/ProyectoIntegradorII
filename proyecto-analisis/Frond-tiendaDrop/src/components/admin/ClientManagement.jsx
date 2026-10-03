import { useEffect, useMemo, useState } from 'react';
import UserService from '../../services/user.service';
import VentaService from '../../services/venta.service';
import { mensajeDeError } from '../../services/api';
import ClientPurchaseHistory from './ClientPurchaseHistory';

const clienteVacio = {
  nombre: '', apellido: '', correo: '', dni: '', telefono: '', direccion: '', rol: 'CLIENTE',
};

const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;

/**
 * Cartera de clientes.
 *
 * Nota: los clientes creados aqui quedan SIN contrasena. Pueden comprar en el
 * POS, pero para entrar a la tienda web deben registrarse con ese mismo correo;
 * el registro reconoce la cuenta y solo le anade la contrasena.
 */
function ClientManagement() {
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [formulario, setFormulario] = useState(clienteVacio);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [clienteHistorial, setClienteHistorial] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const [resClientes, resVentas] = await Promise.all([
        UserService.getClientes(),
        VentaService.getAllVentas(),
      ]);
      setClientes(resClientes.data || []);
      setVentas(resVentas.data || []);
      setMensaje('');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudieron cargar los clientes desde la base de datos.'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  /** Cuantos pedidos y cuanto ha comprado cada cliente. */
  const compras = useMemo(() => ventas.reduce((acumulado, venta) => {
    const id = venta.usuario?.id;
    if (!id) return acumulado;
    const actual = acumulado[id] || { pedidos: 0, total: 0 };
    acumulado[id] = { pedidos: actual.pedidos + 1, total: actual.total + Number(venta.total || 0) };
    return acumulado;
  }, {}), [ventas]);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return clientes;
    return clientes.filter((cliente) => (
      `${cliente.nombre} ${cliente.apellido} ${cliente.correo} ${cliente.dni}`
        .toLowerCase()
        .includes(termino)
    ));
  }, [clientes, busqueda]);

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    try {
      const datos = { ...formulario, rol: 'CLIENTE' };
      if (editandoId) await UserService.update(editandoId, datos);
      else await UserService.create(datos);
      cancelar();
      await cargar();
      setMensaje('Cliente guardado correctamente.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo guardar. Revisa que el correo no esté repetido.'));
    }
  };

  const editar = (cliente) => {
    setEditandoId(cliente.id);
    setFormulario({ ...clienteVacio, ...cliente, rol: 'CLIENTE' });
  };

  const cancelar = () => {
    setEditandoId(null);
    setFormulario(clienteVacio);
  };

  const eliminar = async (cliente) => {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await UserService.remove(cliente.id);
      await cargar();
      setMensaje('Cliente eliminado.');
    } catch {
      setMensaje('No se puede eliminar este cliente porque tiene ventas asociadas.');
    }
  };

  const campo = (clave) => ({
    value: formulario[clave],
    onChange: (evento) => setFormulario({ ...formulario, [clave]: evento.target.value }),
  });

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Clientes</h1>
        </div>
        <label className="admin-search">
          <span>⌕</span>
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar nombre, correo o DNI"
          />
        </label>
      </header>

      {mensaje && <div className="admin-notice" role="status">{mensaje}</div>}

      <div className="split-management">
        <div className="data-card">
          {cargando ? (
            <div className="empty-state">Cargando clientes…</div>
          ) : visibles.length === 0 ? (
            <div className="empty-state">
              <strong>No hay clientes registrados</strong>
              <span>Crea el primero usando el formulario.</span>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th><th>Contacto</th><th>DNI/RUC</th>
                    <th>Pedidos</th><th>Total comprado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <strong>{cliente.nombre} {cliente.apellido}</strong>
                        <small>#{cliente.id}</small>
                      </td>
                      <td>
                        {cliente.correo}
                        <small>{cliente.telefono || 'Sin teléfono'}</small>
                      </td>
                      <td>{cliente.dni || '—'}</td>
                      <td>{compras[cliente.id]?.pedidos || 0}</td>
                      <td>{soles(compras[cliente.id]?.total)}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => editar(cliente)}>Editar</button>
                          <button onClick={() => setClienteHistorial(cliente)}>Historial</button>
                          <button className="danger" onClick={() => eliminar(cliente)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className="editor-card" onSubmit={guardar}>
          <div className="editor-heading">
            <div>
              <p>{editandoId ? 'EDICIÓN' : 'NUEVO REGISTRO'}</p>
              <h2>{editandoId ? 'Editar cliente' : 'Crear cliente'}</h2>
            </div>
            {editandoId && (
              <button type="button" className="text-button" onClick={cancelar}>Cancelar</button>
            )}
          </div>

          <div className="field-grid">
            <label>Nombres<input required {...campo('nombre')} /></label>
            <label>Apellidos<input {...campo('apellido')} /></label>
            <label className="full-field">Correo<input required type="email" {...campo('correo')} /></label>
            <label>DNI/RUC<input {...campo('dni')} /></label>
            <label>Teléfono<input {...campo('telefono')} /></label>
            <label className="full-field">Dirección<input {...campo('direccion')} /></label>
          </div>

          <button className="primary-button full-button" type="submit">
            {editandoId ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </form>
      </div>
      <ClientPurchaseHistory cliente={clienteHistorial} ventas={ventas} onClose={() => setClienteHistorial(null)} />
    </section>
  );
}

export default ClientManagement;
