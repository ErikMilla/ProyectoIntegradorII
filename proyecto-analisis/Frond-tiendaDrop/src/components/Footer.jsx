import { Link } from 'react-router-dom';
import '../css/Footer.css';
import Brand from './Brand';

const COLUMNAS = [
  {
    titulo: 'Comprar',
    enlaces: [
      ['/catalogo/Hombre', 'Hombre'],
      ['/catalogo/Mujer', 'Mujer'],
      ['/catalogo/Niños', 'Niños'],
      ['/catalogo', 'Todo el catálogo'],
    ],
  },
  {
    titulo: 'Mi cuenta',
    enlaces: [
      ['/login', 'Iniciar sesión'],
      ['/registro', 'Crear cuenta'],
      ['/mis-pedidos', 'Mis pedidos'],
      ['/carrito', 'Carrito'],
    ],
  },
  {
    titulo: 'Drop Store',
    enlaces: [
      ['/nosotros', 'Quiénes somos'],
      ['/nosotros#envios', 'Envíos y cambios'],
    ],
  },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-top">
        <div className="site-footer-brand">
          <Brand />
          <p>Zapatillas urbanas y deportivas originales. Enviamos a todo el Perú y tienes 30 días para cambiar tu talla.</p>
        </div>

        {COLUMNAS.map((columna) => (
          <nav key={columna.titulo} className="site-footer-col" aria-label={columna.titulo}>
            <h2>{columna.titulo}</h2>
            <ul>
              {columna.enlaces.map(([to, label]) => (
                <li key={label}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="site-footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} Drop Store</span>
          <span>Lima, Perú</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
