import { useEffect, useState } from 'react';
import UserService from '../../services/user.service';

function UserManagement() {
  const [users, setUsers] = useState([]); const [query, setQuery] = useState(''); const [message, setMessage] = useState('');
  const load = () => UserService.getAll().then((response) => setUsers(response.data || [])).catch(() => setMessage('No se pudieron cargar los usuarios.'));
  useEffect(() => { load(); }, []);
  const changeRole = async (user, rol) => { try { await UserService.update(user.id, { ...user, rol }); await load(); setMessage('Rol actualizado.'); } catch { setMessage('No se pudo actualizar el rol.'); } };
  const filtered = users.filter((user) => `${user.nombre} ${user.apellido} ${user.correo} ${user.rol}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-module"><header className="module-header"><div><p>CONTROL DE ACCESO</p><h1>Usuarios</h1></div><label className="admin-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario" /></label></header>{message && <div className="admin-notice">{message}</div>}<div className="data-card"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Usuario</th><th>Correo</th><th>DNI</th><th>Rol</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><strong>{user.nombre} {user.apellido}</strong><small>#{user.id}</small></td><td>{user.correo}</td><td>{user.dni || '—'}</td><td><select className="role-select" value={user.rol} onChange={(event) => changeRole(user, event.target.value)}><option>CLIENTE</option><option>ADMIN</option><option>ALMACENERO</option><option>VENDEDOR</option></select></td></tr>)}</tbody></table></div></div></section>;
}

export default UserManagement;
