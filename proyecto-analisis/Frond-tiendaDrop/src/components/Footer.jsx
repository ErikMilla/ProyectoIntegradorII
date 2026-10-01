import { Link } from 'react-router-dom';
import '../css/Footer.css';

function Footer() {
  return (
    <footer id="nosotros">
      <div className="footer-top">
        <div className="footer-grid">
          <section className="footer-brand" aria-label="Drop Store">
            <Link to="/" className="nav-logo">
              <span className="brand-mark" aria-hidden="true">▶</span>
              <span>DROP</span>
            </Link>
            <p>Zapatillas urbanas y deportivas para quienes viven el movimiento.</p>
          </section>

          <section className="footer-col">
            <h3>Use cases</h3>
            <ul>
              <li><Link to="/catalogo/Hombre">Hombre</Link></li>
              <li><Link to="/catalogo/Mujer">Mujer</Link></li>
              <li><Link to="/catalogo">Nuevos ingresos</Link></li>
            </ul>
          </section>

          <section className="footer-col">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/catalogo">Catálogo</Link></li>
              <li><Link to="/carrito">Carrito</Link></li>
              <li><Link to="/login">Mi cuenta</Link></li>
            </ul>
          </section>

          <section className="footer-col">
            <h3>Resources</h3>
            <ul>
              <li><a href="#nosotros">Nosotros</a></li>
              <li><a href="#nosotros">Envíos y devoluciones</a></li>
              <li><a href="#nosotros">Soporte</a></li>
            </ul>
          </section>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>© 2026 Drop Store</span>
          <span>Perú · Zapatillas auténticas</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
