export default function IntranetAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div style={{ padding: '50px' }}>
      <h1>Intranet Admin</h1>
      <p>Bienvenido, {user.nombre} {user.apellido}</p>
      <p>Rol: {user.rol}</p>
    </div>
  );
}