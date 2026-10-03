import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import InventoryService from '../services/inventory.service';
import ResenaService from '../services/resena.service';
import { mensajeDeError, resolverUrlImagen } from '../services/api';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { soles, talla as formatoTalla } from '../utils/formato';
import Estrellas from '../components/Estrellas';
import Icon from '../components/Icon';
import '../css/DetalleProducto.css';

const fechaCorta = (valor) => (valor
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(new Date(valor))
  : '');

/** Lima Express: lo que la tienda cobra y promete por el envío rápido. */
const ENVIO_EXPRESS = 12.90;
const CUOTAS_SIN_INTERES = 3;

/**
 * Ficha de producto (RF06, RF08).
 *
 * Muestra el modelo con su foto, precio, tallas disponibles con su stock,
 * selector de cantidad y las reseñas de otros clientes. Del catálogo entra
 * aquí, elige talla y cantidad, y de aquí pasa al carrito.
 */
function DetalleProducto() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { currentUser } = useAuth();

  const [producto, setProducto] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [varianteId, setVarianteId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [resenas, setResenas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [formResena, setFormResena] = useState({ calificacion: 5, comentario: '' });
  const [mensajeResena, setMensajeResena] = useState(null);
  const [enviandoResena, setEnviandoResena] = useState(false);

  const cargarResenas = useCallback(async () => {
    try {
      const { data } = await ResenaService.listar(id);
      setResenas(data.items || []);
      setPromedio(data.promedio || 0);
    } catch {
      // Las reseñas son secundarias: si fallan, la ficha sigue sirviendo.
      setResenas([]);
    }
  }, [id]);

  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      setCargando(true);
      setError('');
      try {
        const { data } = await InventoryService.getProductoConVariantes(id);
        if (!vigente) return;

        setProducto(data.producto);
        setVariantes(data.variantes || []);

        // Preseleccionamos la primera talla que tenga stock.
        const disponible = (data.variantes || []).find((v) => v.stock > 0);
        setVarianteId(disponible ? disponible.id : null);
      } catch (errorPeticion) {
        if (vigente) setError(mensajeDeError(errorPeticion, 'No encontramos este producto.'));
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();
    cargarResenas();
    return () => { vigente = false; };
  }, [id, cargarResenas]);

  const tallas = useMemo(
    () => [...variantes].sort((a, b) => Number(a.talla) - Number(b.talla)),
    [variantes],
  );

  const variante = useMemo(
    () => variantes.find((v) => v.id === varianteId) || null,
    [variantes, varianteId],
  );

  const stockDisponible = variante?.stock ?? 0;
  const agotadoTodo = variantes.length > 0 && variantes.every((v) => v.stock <= 0);
  const precio = Number(producto?.precioVenta || 0);
  const marca = tallas[0]?.marcaNombre || '';

  // Al cambiar de talla, la cantidad no puede quedar por encima del nuevo stock.
  useEffect(() => {
    setCantidad((actual) => Math.min(Math.max(1, actual), Math.max(1, stockDisponible)));
  }, [stockDisponible]);

  useEffect(() => {
    if (producto?.nombre) document.title = `${producto.nombre} · Drop Store`;
    return () => { document.title = 'Drop Store · Zapatillas urbanas'; };
  }, [producto?.nombre]);

  const cambiarCantidad = (delta) => {
    setCantidad((actual) => Math.min(Math.max(1, actual + delta), Math.max(1, stockDisponible)));
  };

  const agregarAlCarrito = () => {
    if (!variante || variante.stock <= 0) return;

    // El carrito trabaja con la forma que devuelve el catálogo, así que
    // adaptamos lo que da esta ficha antes de guardarlo.
    addItem(
      {
        id: Number(id),
        nombre: producto.nombre,
        foto: producto.foto,
        prcio_venta: precio,
      },
      { id: variante.id, talla: variante.talla, stock: variante.stock },
      cantidad,
    );

    setAviso(`Agregaste ${cantidad} ${cantidad === 1 ? 'par' : 'pares'} en talla ${formatoTalla(variante.talla)}.`);
  };

  const publicarResena = async (evento) => {
    evento.preventDefault();
    setMensajeResena(null);
    setEnviandoResena(true);
    try {
      await ResenaService.crear(id, {
        usuarioId: currentUser.id,
        calificacion: Number(formResena.calificacion),
        comentario: formResena.comentario,
      });
      setFormResena({ calificacion: 5, comentario: '' });
      await cargarResenas();
      setMensajeResena({ tipo: 'ok', texto: 'Gracias. Tu reseña ya está publicada.' });
    } catch (errorPeticion) {
      setMensajeResena({ tipo: 'error', texto: mensajeDeError(errorPeticion, 'No se pudo publicar tu reseña.') });
    } finally {
      setEnviandoResena(false);
    }
  };

  if (cargando) {
    return (
      <div className="container pdp" role="status" aria-label="Cargando producto">
        <div className="pdp-layout">
          <div className="pdp-gallery skeleton" />
          <div className="pdp-info">
            <span className="skeleton pdp-skel pdp-skel--sm" />
            <span className="skeleton pdp-skel pdp-skel--lg" />
            <span className="skeleton pdp-skel pdp-skel--md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="container pdp-missing">
        <h1 className="page-title">Producto no encontrado</h1>
        <p role="alert">{error || 'No encontramos este producto.'} Puede que lo hayamos retirado del catálogo.</p>
        <Link to="/catalogo" className="btn btn--primary">Volver al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="container pdp">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <ol>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/catalogo">Catálogo</Link></li>
          <li><span aria-current="page">{producto.nombre}</span></li>
        </ol>
      </nav>

      <div className="pdp-layout">
        <div className="pdp-gallery">
          <img src={resolverUrlImagen(producto.foto)} alt={producto.nombre} />
          {producto.modelo && <span className="product-card-code">{producto.modelo}</span>}
        </div>

        <div className="pdp-info">
          {marca && <p className="pdp-brand">{marca}</p>}
          <h1 className="page-title pdp-title">{producto.nombre}</h1>

          <a href="#resenas" className="pdp-rating">
            <Estrellas valor={promedio} />
            <span>{resenas.length > 0 ? `${promedio.toFixed(1)} · ${resenas.length} ${resenas.length === 1 ? 'reseña' : 'reseñas'}` : 'Sin reseñas todavía'}</span>
          </a>

          <p className="pdp-price">{soles(precio)}</p>
          <p className="pdp-installments">
            o {CUOTAS_SIN_INTERES} cuotas de {soles(precio / CUOTAS_SIN_INTERES)} sin intereses
          </p>

          <fieldset className="pdp-sizes">
            <legend>
              <span>Talla (EU)</span>
              {variante && variante.stock > 0 && (
                <span className={`pdp-stock${variante.stock <= 3 ? ' is-low' : ''}`}>
                  {variante.stock <= 3
                    ? `Quedan ${variante.stock} en talla ${formatoTalla(variante.talla)}`
                    : `${variante.stock} disponibles`}
                </span>
              )}
            </legend>
            {tallas.length === 0 ? (
              <p className="pdp-note">Este modelo todavía no tiene tallas registradas.</p>
            ) : (
              <div className="pdp-size-grid">
                {tallas.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    disabled={opcion.stock <= 0}
                    aria-pressed={opcion.id === varianteId}
                    aria-label={opcion.stock > 0 ? `Talla ${formatoTalla(opcion.talla)}` : `Talla ${formatoTalla(opcion.talla)}, agotada`}
                    onClick={() => { setVarianteId(opcion.id); setAviso(''); }}
                  >
                    {formatoTalla(opcion.talla)}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <div className="pdp-buy">
            <div className="stepper" role="group" aria-label="Cantidad">
              <button type="button" onClick={() => cambiarCantidad(-1)} disabled={cantidad <= 1} aria-label="Quitar un par">
                <Icon name="minus" size={18} />
              </button>
              <output aria-live="polite">{cantidad}</output>
              <button type="button" onClick={() => cambiarCantidad(1)} disabled={cantidad >= stockDisponible} aria-label="Agregar un par">
                <Icon name="plus" size={18} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn--red pdp-add"
              disabled={!variante || stockDisponible <= 0}
              onClick={agregarAlCarrito}
            >
              <Icon name="bag" size={20} />
              {agotadoTodo ? 'Agotado' : 'Añadir al carrito'}
            </button>
          </div>

          {aviso && (
            <div className="pdp-added" role="status">
              <Icon name="check" size={20} />
              <span>{aviso}</span>
              <Link to="/carrito" className="link">Ver carrito</Link>
            </div>
          )}

          <ul className="pdp-perks">
            <li>
              <Icon name="truck" />
              <span><strong>Lima Express por {soles(ENVIO_EXPRESS)}</strong>Llega el siguiente día hábil.</span>
            </li>
            <li>
              <Icon name="swap" />
              <span><strong>Cambio de talla</strong>Tienes 30 días si no te queda.</span>
            </li>
            <li>
              <Icon name="card" />
              <span><strong>Paga como prefieras</strong>Tarjeta, Yape o Plin. Cuotas con BCP, BBVA y más.</span>
            </li>
          </ul>

          {producto.descripcion && (
            <section className="pdp-description" aria-labelledby="descripcion-title">
              <h2 id="descripcion-title">Descripción</h2>
              <p>{producto.descripcion}</p>
            </section>
          )}
        </div>
      </div>

      <section id="resenas" className="pdp-reviews" aria-labelledby="resenas-title">
        <div className="pdp-reviews-summary">
          <h2 id="resenas-title" className="home-heading">Reseñas</h2>
          {resenas.length > 0 ? (
            <>
              <p className="pdp-reviews-score">{promedio.toFixed(1)}<span>/5</span></p>
              <Estrellas valor={promedio} />
              <p className="pdp-note">{resenas.length} {resenas.length === 1 ? 'opinión' : 'opiniones'} de clientes</p>
            </>
          ) : (
            <p className="pdp-note">Nadie ha opinado todavía sobre este modelo.</p>
          )}
        </div>

        <div className="pdp-reviews-body">
          {resenas.length > 0 && (
            <ul className="pdp-review-list">
              {resenas.map((resena) => (
                <li key={resena.id}>
                  <div className="pdp-review-head">
                    <Estrellas valor={resena.calificacion} />
                    <strong>{resena.autor}</strong>
                    <time dateTime={resena.fecha}>{fechaCorta(resena.fecha)}</time>
                  </div>
                  <p>{resena.comentario}</p>
                </li>
              ))}
            </ul>
          )}

          {currentUser ? (
            <form className="pdp-review-form" onSubmit={publicarResena}>
              <h3>{resenas.length > 0 ? 'Cuéntanos qué te parecieron' : 'Sé el primero en opinar'}</h3>

              <SelectorEstrellas
                valor={Number(formResena.calificacion)}
                alCambiar={(calificacion) => setFormResena({ ...formResena, calificacion })}
              />

              <div className="field">
                <label htmlFor="resena-comentario">Comentario</label>
                <textarea
                  id="resena-comentario"
                  className="input"
                  required
                  rows="3"
                  maxLength="1000"
                  placeholder="¿Cómo te quedaron? ¿La talla vino exacta?"
                  value={formResena.comentario}
                  onChange={(evento) => setFormResena({ ...formResena, comentario: evento.target.value })}
                />
              </div>

              <button type="submit" className="btn btn--primary" disabled={enviandoResena}>
                {enviandoResena ? 'Publicando…' : 'Publicar reseña'}
              </button>

              {mensajeResena && (
                <p className={`notice notice--${mensajeResena.tipo}`} role={mensajeResena.tipo === 'error' ? 'alert' : 'status'}>
                  {mensajeResena.texto}
                </p>
              )}
            </form>
          ) : (
            <p className="pdp-review-guest">
              <Link to="/login" state={{ destino: `/producto/${id}` }} className="link">Inicia sesión</Link> para dejar tu reseña.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/** Calificación de 1 a 5 como radios: se elige con clic o con las flechas. */
function SelectorEstrellas({ valor, alCambiar }) {
  const [resaltado, setResaltado] = useState(0);
  const mostrado = resaltado || valor;

  return (
    <fieldset className="star-picker" onMouseLeave={() => setResaltado(0)}>
      <legend>Calificación</legend>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= mostrado ? 'is-on' : ''} onMouseEnter={() => setResaltado(n)}>
            <input
              type="radio"
              name="calificacion"
              value={n}
              checked={valor === n}
              onChange={() => alCambiar(n)}
              className="visually-hidden"
            />
            <span aria-hidden="true">★</span>
            <span className="visually-hidden">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
          </label>
        ))}
        <span className="star-picker-text" aria-hidden="true">{['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][mostrado]}</span>
      </div>
    </fieldset>
  );
}

export default DetalleProducto;
