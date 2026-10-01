/* eslint-disable no-irregular-whitespace */
import { useMemo, useState } from 'react';
import SidebarAdmin from '../../components/admin/SidebarAdmin';
import '../../css/Intranet.css';

const shoes = [
  ['Air Force One', 'S/430', '15'],
  ['Jordan 1 low', 'S/520', '8'],
  ['Forum Low', 'S/379', '21'],
  ['Campus 00', 'S/399', '12'],
  ['Rivalry Low', 'S/279', '18'],
];

const customers = ['Juan Perez', 'Maria Flores', 'Kevin Clemente', 'Andrea Ruiz', 'Erick M.'];

function ProductThumb({ dark = false }) {
  return <div className={`backoffice-shoe ${dark ? 'backoffice-shoe-dark' : ''}`} aria-hidden="true">◒</div>;
}

function Dashboard() {
  return <>
    <div className="backoffice-heading">
      <h1>DASHBOARD</h1>
      <button className="date-filter">28 Jan, 2024 - 28 Dec, 2024⌄</button>
    </div>
    <section className="metric-row">
      <article className="metric-card"><span>Ventas de hoy</span><strong>S/20.4K</strong><small>Vendidos 123 artículos</small><b className="metric-ring ring-black" /></article>
      <article className="metric-card"><span>Ganancias</span><strong>S/50.4K</strong><small>Disponible para pago</small><b className="metric-ring ring-green" /></article>
      <article className="metric-card"><span>Garantías</span><strong>S/20.4K</strong><small>Disponible para pago</small><b className="metric-ring ring-orange" /></article>
    </section>
    <section className="dashboard-grid">
      <article className="chart-card">
        <div><span>Ganancias Totales</span><strong>$50.4K</strong><em>↑ 5% que el mes pasado</em></div>
        <div className="bar-chart" aria-label="Gráfico de ganancias mensuales">
          {[62, 80, 44, 82, 68, 86, 61, 38, 67, 81, 64, 83].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
        <div className="chart-months">Jan Feb Mar Apr May Jun Jul Aug Sep</div>
      </article>
      <article className="brands-card"><h2>Marcas más vendidas</h2>{[['Nike', '70'], ['Adidas', '40'], ['Jordan', '60'], ['Productos de limpieza', '80'], ['Otros', '20']].map(([name, value]) => <div className="brand-progress" key={name}><span>{name}</span><b>{value}%</b><i><em style={{ width: `${value}%` }} /></i></div>)}</article>
      <article className="backoffice-table dashboard-orders"><table><thead><tr><th>Productos</th><th>Order ID</th><th>Fecha</th><th>Nombre Cliente</th><th>Status</th><th>Monto</th><th>Acción</th></tr></thead><tbody>{shoes.slice(0, 4).map(([name], index) => <tr key={name}><td>{name}</td><td>#11232</td><td>Jun 29, 2022</td><td>Kvaratskhelia</td><td><span className={`status-dot status-${index}`}>● {index === 1 ? 'Pendiente' : index === 2 ? 'Cancelado' : 'Entregado'}</span></td><td>$400.00</td><td>•••</td></tr>)}</tbody></table></article>
    </section>
  </>;
}

function Inventory() {
  return <><div className="backoffice-heading"><h1>INVENTARIO</h1><div className="toolbar"><button>＋</button><button>⌕</button><button>▥</button></div></div><div className="management-grid"><article className="dark-table-card"><table><thead><tr><th>Producto</th><th>Marca</th><th>Talla</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{shoes.map(([name, price, stock]) => <tr key={name}><td><ProductThumb /></td><td>NIKE</td><td>42</td><td>{price}</td><td>{stock}</td><td>En Stock</td><td>•••</td></tr>)}</tbody></table></article><ProductForm /></div></>;
}

function ProductForm() {
  return <aside className="backoffice-form"><h2>Formulario</h2><label>Producto<input /></label><div className="form-two"><label>Marca<select><option /></select></label><label>Talla<select><option /></select></label></div><label>Precio de Venta<input /></label><label>Stock Inicial<input /></label><label>Imagen<span className="upload-box">⇧</span></label><button>GUARDAR</button></aside>;
}

function Customers() {
  return <><div className="backoffice-heading"><h1>CLIENTES</h1><div className="toolbar"><button>＋</button><button>⌕</button><button>▥</button></div></div><div className="management-grid customers-grid"><article className="dark-table-card"><table><thead><tr><th>ID Cliente</th><th>Nombre</th><th>Email</th><th>DNI/RUC</th><th>Total comprado</th><th>Nro. pedidos</th><th>Acción</th></tr></thead><tbody>{customers.map((name, index) => <tr key={name}><td>{index + 1}</td><td>{name}</td><td>cliente@drop.com</td><td>12345678</td><td>5</td><td>S/2400</td><td>•••</td></tr>)}</tbody></table></article><aside className="backoffice-form customer-form"><h2>Formulario</h2>{['Nombres y Apellidos', 'DNI/RUC', 'Email', 'Dirección'].map(label => <label key={label}>{label}<input /></label>)}<button>GUARDAR</button></aside></div></>;
}

function Invoices() {
  return <><div className="backoffice-heading"><h1>FACTURAS</h1><div className="toolbar"><button>＋</button><button>⌕</button><button>▥</button></div></div><article className="invoice-table"><table><thead><tr><th>ID Cliente</th><th>Cliente</th><th>Fecha</th><th>Vendedor</th><th>Subtotal</th><th>IGV</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{customers.concat(['Lucia Torres']).map((customer, index) => <tr key={customer}><td>{index + 1}</td><td>{customer}</td><td>2026/08/23</td><td>VENDEDOR A</td><td>S/2400</td><td>S/40</td><td>S/2440</td><td>Pagada</td><td>⌕　▧　♲</td></tr>)}</tbody></table></article></>;
}

function Pos() {
  return <><div className="backoffice-heading"><h1>MÓDULO DE VENTAS PRESENCIAL</h1></div><div className="pos-layout"><button className="barcode-box" aria-label="Escanear producto">▥</button><article className="pos-cart"><h3>CARRITO DE COMPRAS</h3>{shoes.slice(0, 2).map(([name, price]) => <div key={name}><ProductThumb /><span>{name}<small>Cantidad: 1 · Talla: 42</small></span><b>{price}</b></div>)}<strong>Total a Pagar: S/1350</strong></article><section className="pos-customer"><label>Selecciona Cliente<input placeholder="Buscar cliente" /></label><button>Finalizar Compra</button></section></div></>;
}

function Users() {
  return <><div className="backoffice-heading"><h1>USUARIOS</h1><div className="toolbar"><button>＋</button><button>⌕</button></div></div><article className="invoice-table"><table><thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{customers.map((name, index) => <tr key={name}><td>{index + 1}</td><td>{name}</td><td>usuario@drop.com</td><td>{index === 0 ? 'ADMIN' : 'CLIENTE'}</td><td>Activo</td><td>⌕　♲</td></tr>)}</tbody></table></article></>;
}

function Settings() { return <section className="settings-card"><h1>CONFIGURACIÓN</h1><p>Administra las preferencias de la tienda DROP.</p><label>Nombre de la tienda<input defaultValue="DROP Store" /></label><label>Correo de contacto<input defaultValue="contacto@dropstore.local" /></label><button>GUARDAR CAMBIOS</button></section>; }

function IntranetAdmin() {
  const [section, setSection] = useState('dashboard');
  const content = useMemo(() => ({ dashboard: <Dashboard />, usuarios: <Users />, facturacion: <Invoices />, inventario: <Inventory />, clientes: <Customers />, pos: <Pos />, settings: <Settings /> })[section], [section]);
  return <div className="backoffice-layout"><SidebarAdmin seccionActiva={section} setSeccionActiva={setSection} /><main className="backoffice-content">{content}</main></div>;
}

export default IntranetAdmin;
