// src/components/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Footer.css';

function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-grid">
          {/* COLUMNA 1: NOSOTROS */}
          <div className="footer-col">
            <h3>NOSOTROS</h3>
            <ul>
              <li><Link to="/tiendas">Tiendas</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><Link to="/trabaja-con-nosotros">Trabaja con nosotros</Link></li>
              <li><Link to="/reclamos">Libro de reclamaciones</Link></li>
            </ul>
          </div>

          {/* COLUMNA 2: LEGALES */}
          <div className="footer-col">
            <h3>LEGALES</h3>
            <ul>
              <li><Link to="/privacidad">Política de Privacidad</Link></li>
              <li><Link to="/envios">Envíos y devoluciones</Link></li>
              <li><Link to="/preguntas">Preguntas frecuentes</Link></li>
              <li><Link to="/terminos">Términos y condiciones</Link></li>
            </ul>
          </div>

          {/* COLUMNA 3: MI CUENTA */}
          <div className="footer-col">
            <h3>MI CUENTA</h3>
            <ul>
              <li><Link to="/mi-cuenta">Mi cuenta</Link></li>
              <li><Link to="/mis-compras">Mis compras</Link></li>
              <li><Link to="/mis-direcciones">Mis direcciones</Link></li>
              <li><Link to="/wishlist">Wish List</Link></li>
            </ul>
          </div>

          {/* COLUMNA 4: NEWSLETTER */}
          <div className="footer-col">
            <h3>NEWSLETTER</h3>
            <p>Suscríbete y recibe todas nuestras novedades!</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Ingresa tu e-mail" />
              <button>SUSCRIBIRME</button>
            </div>
            <div className="social-links">
              {/* Iconos sociales (puedes usar iconos de React o Font Awesome) */}
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">ig</a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="payment-methods">
          {/* Aquí irían los iconos de VISA, Mastercard, QR, etc. */}
          <span>💳 VISA</span>
          <span>⚫ Mastercard</span>
          <span>🏧 QR</span>
          <span>© Copyright 2025 | TiendaDrop</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;