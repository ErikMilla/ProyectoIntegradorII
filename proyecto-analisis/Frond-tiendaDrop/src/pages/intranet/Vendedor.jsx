export default function IntranetVendedor() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div style={{ padding: '50px' }}>
      <h1>Intranet Vendedor</h1>
      <p>Bienvenido, {user.nombre} {user.apellido}</p>
      <p>Rol: {user.rol}</p>
    </div>
  );
}