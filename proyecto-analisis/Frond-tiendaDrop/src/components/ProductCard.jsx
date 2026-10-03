import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolverUrlImagen } from '../services/api';
import { resumenTallas, soles } from '../utils/formato';
import Estrellas from './Estrellas';
import '../css/ProductCard.css';

/**
 * Tarjeta de un modelo (producto agrupado con sus tallas).
 *
 * Toda la tarjeta es clicable, pero hay un solo enlace real (el nombre) que se
 * estira con ::after: el lector de pantalla oye el producto una vez y el
 * teclado tiene una sola parada por tarjeta.
 *
 * La etiqueta con el código de estilo imita la de la caja de la zapatilla.
 */
function ProductCard({ producto, calificacion, puesto, nivel = 'h3' }) {
  const Encabezado = nivel;
  const [sinFoto, setSinFoto] = useState(!producto.foto);
  const enlace = `/producto/${producto.id}`;
  const tallas = resumenTallas(producto.variantes);
  const agotado = tallas === 'Agotado';

  return (
    <article className={`product-card${agotado ? ' product-card--agotado' : ''}`}>
      <div className="product-card-media">
        {sinFoto ? (
          <span className="product-card-nophoto">Foto no disponible</span>
        ) : (
          <img
            src={resolverUrlImagen(producto.foto)}
            alt=""
            loading="lazy"
            onError={() => setSinFoto(true)}
          />
        )}
        {puesto && <span className="product-card-rank">Nº {puesto}</span>}
        {producto.modelo && <span className="product-card-code">{producto.modelo}</span>}
      </div>

      <div className="product-card-body">
        <p className="product-card-brand">{producto.marcaPrincipal}</p>
        <Encabezado className="product-card-name">
          <Link to={enlace}>{producto.nombre || 'Modelo sin nombre'}</Link>
        </Encabezado>
        <p className="product-card-price">{soles(producto.prcio_venta)}</p>
        <p className={`product-card-sizes${agotado ? ' is-out' : ''}`}>{tallas}</p>
        {calificacion?.total > 0 && (
          <p className="product-card-rating">
            <Estrellas valor={calificacion.promedio} />
            <span>{calificacion.promedio.toFixed(1)} ({calificacion.total})</span>
          </p>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="product-card-media skeleton" />
      <div className="product-card-body">
        <span className="skeleton-line skeleton" />
        <span className="skeleton-line skeleton" />
        <span className="skeleton-line skeleton" />
      </div>
    </div>
  );
}

export default ProductCard;
