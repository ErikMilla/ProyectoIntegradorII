import { useEffect, useMemo, useState } from 'react';
import UserService from '../../services/user.service';
import VentaService from '../../services/venta.service';

const emptyClient = { nombre: '', apellido: '', correo: '', dni: '', telefono: '', direccion: '', rol: 'CLIENTE' };
const money = (value) => `S/${Number(value || 0).toFixed(2)}`;

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState(emptyClient);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [clientsResponse, salesResponse] = await Promise.all([UserService.getClientes(), VentaService.getAllVentas()]);
      setClients(clientsResponse.data || []); setSales(salesResponse.data || []); setMessage('');
    } catch { setMessage('No se pudieron cargar los clientes desde la base de datos.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => sales.reduce((result, sale) => {
    const id = sale.usuario?.id; if (!id) return result;
    const current = result[id] || { orders: 0, total: 0 };
    result[id] = { orders: current.orders + 1, total: current.total + Number(sale.total || 0) };
    return result;
  }, {}), [sales]);
  const filtered = clients.filter((client) => `${client.nombre} ${client.apellido} ${client.correo} ${client.dni}`.toLowerCase().includes(query.toLowerCase()));

  const save = async (event) => {
    event.preventDefault(); setMessage('');
    try {
      const payload = { ...form, rol: 'CLIENTE' };
      if (editingId) await UserService.update(editingId, payload); else await UserService.create(payload);
      setForm(emptyClient); setEditingId(null); await load(); setMessage('Cliente guardado en la base de datos.');
    } catch (error) { setMessage(typeof error.response?.data === 'string' ? error.response.data : 'No se pudo guardar el cliente. Revisa que el correo no esté repetido.'); }
  };
  const edit = (client) => { setEditingId(client.id); setForm({ ...emptyClient, ...client, rol: 'CLIENTE' }); };
  const remove = async (client) => {
    if (!window.confirm(`¿Eliminar a ${client.nombre}? Esta acción no se puede deshacer.`)) return;
    try { await UserService.remove(client.id); await load(); setMessage('Cliente eliminado.'); }
    catch { setMessage('No se puede eliminar este cliente porque tiene ventas asociadas.'); }
  };

  return <section className="admin-module">
    <header className="module-header"><div><p>BASE DE DATOS</p><h1>Clientes</h1></div><label className="admin-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, correo o DNI" /></label></header>
    {message && <div className="admin-notice" role="status">{message}</div>}
    <div className="split-management">
      <div className="data-card">{loading ? <div className="empty-state">Cargando clientes…</div> : filtered.length === 0 ? <div className="empty-state"><strong>No hay clientes en MySQL</strong><span>Crea el primero usando el formulario.</span></div> : <div className="table-scroll"><table className="admin-table"><thead><tr><th>Cliente</th><th>Contacto</th><th>DNI/RUC</th><th>Pedidos</th><th>Total comprado</th><th>Acciones</th></tr></thead><tbody>{filtered.map((client) => <tr key={client.id}><td><strong>{client.nombre} {client.apellido}</strong><small>#{client.id}</small></td><td>{client.correo}<small>{client.telefono || 'Sin teléfono'}</small></td><td>{client.dni || '—'}</td><td>{metrics[client.id]?.orders || 0}</td><td>{money(metrics[client.id]?.total)}</td><td><div className="row-actions"><button onClick={() => edit(client)}>Editar</button><button className="danger" onClick={() => remove(client)}>Eliminar</button></div></td></tr>)}</tbody></table></div>}</div>
      <form className="editor-card" onSubmit={save}><div className="editor-heading"><div><p>{editingId ? 'EDICIÓN' : 'NUEVO REGISTRO'}</p><h2>{editingId ? 'Editar cliente' : 'Crear cliente'}</h2></div>{editingId && <button type="button" className="text-button" onClick={() => { setEditingId(null); setForm(emptyClient); }}>Cancelar</button>}</div><div className="field-grid"><label>Nombres<input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label><label>Apellidos<input value={form.apellido} onChange={(event) => setForm({ ...form, apellido: event.target.value })} /></label><label className="full-field">Correo<input required type="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} /></label><label>DNI/RUC<input value={form.dni} onChange={(event) => setForm({ ...form, dni: event.target.value })} /></label><label>Teléfono<input value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} /></label><label className="full-field">Dirección<input value={form.direccion} onChange={(event) => setForm({ ...form, direccion: event.target.value })} /></label></div><button className="primary-button full-button" type="submit">{editingId ? 'Guardar cambios' : 'Crear cliente'}</button></form>
    </div>
  </section>;
}

export default ClientManagement;
