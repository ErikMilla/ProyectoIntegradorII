import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InventoryService from '../services/inventory.service';
import ResenaService from '../services/resena.service';
import ContentService from '../services/content.service';
import { agruparPorProducto } from '../utils/productGrouping';
import { resolverUrlImagen } from '../services/api';
import { resumenTallas, soles } from '../utils/formato';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import Icon from '../components/Icon';
import '../css/Home.css';

const GENEROS = ['Hombre', 'Mujer', 'Niños'];

const BENEFICIOS = [
  ['truck', 'Envíos a todo el Perú', 'En Lima llega el siguiente día hábil'],
  ['swap', 'Cambios fáciles', 'Tienes 30 días para decidir'],
  ['badge', 'Productos originales', 'Calidad que puedes comprobar'],
  ['shield', 'Pago seguro', 'Tarjeta, Yape o Plin'],
];

function Home() {
  const [productos, setProductos] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [rankingVentas, setRankingVentas] = useState([]);
  const [contenido, setContenido] = useState({
    etiqueta: `Catálogo ${new Date().getFullYear()}`,
    titulo: 'Streetwear que marca el paso.',
    textoBoton: 'Comprar ahora',
    enlaceBoton: '/catalogo',
    alturaEscritorio: 520,
    alturaMovil: 430,
    posicionImagen: 'centro',
  });
  const [cargando, setCargando] = useState(true);
  const [correo, setCorreo] = useState('');
  const [suscrito, setSuscrito] = useState(false);

  useEffect(() => {
    Promise.all([InventoryService.getAllProductos(), InventoryService.getMasVendidos()])
      .then(([respuesta, ranking]) => {
        setProductos(agruparPorProducto(respuesta.data));
        setRankingVentas(ranking.data || []);
      })
      .catch((error) => console.error('Error al cargar el catálogo de la portada:', error))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    ContentService.obtener()
      .then(({ data }) => setContenido((actual) => ({ ...actual, ...data })))
      .catch(() => {});
  }, []);

  const disponibles = useMemo(
    () => productos.filter((producto) => producto.variantes.some((variante) => variante.stock > 0)),
    [productos],
  );

  const puestoEnRanking = useMemo(
    () => new Map(rankingVentas.map((fila, indice) => [Number(fila.productoId), indice])),
    [rankingVentas],
  );

  const destacados = useMemo(() => [...disponibles]
    .sort((a, b) => (puestoEnRanking.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (puestoEnRanking.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 4), [disponibles, puestoEnRanking]);

  const novedades = useMemo(
    () => disponibles.filter((producto) => !destacados.some((item) => item.id === producto.id)).slice(0, 5),
    [disponibles, destacados],
  );

  const [enFoco, ...recienLlegados] = novedades;

  useEffect(() => {
    if (destacados.length === 0) return undefined;
    let cancelado = false;
    Promise.all(destacados.map((producto) => ResenaService.listar(producto.id)
      .then((respuesta) => [producto.id, respuesta.data])
      .catch(() => [producto.id, { total: 0, promedio: 0 }])))
      .then((resultados) => {
        if (!cancelado) setCalificaciones(Object.fromEntries(resultados));
      });
    return () => { cancelado = true; };
  }, [destacados]);

  const categorias = useMemo(() => [
    ...GENEROS.map((genero) => {
      const delGenero = disponibles.filter((producto) => producto.variantes.some((v) => v.genero === genero));
      return { label: genero, to: `/catalogo/${genero}`, total: delGenero.length };
    }),
    { label: 'Todo', to: '/catalogo', total: disponibles.length },
  ], [disponibles]);

  const suscribirse = (evento) => {
    evento.preventDefault();
    if (!correo.trim()) return;
    setSuscrito(true);
    setCorreo('');
  };

  const imagenHero = contenido.imagenBanner || destacados[0]?.foto;

  return (
    <div className="home">
      <section
        className="home-hero"
        aria-labelledby="hero-title"
        style={{ '--hero-height': `${contenido.alturaEscritorio}px`, '--hero-height-mobile': `${contenido.alturaMovil}px` }}
      >
        {imagenHero && (
          <img
            className={`home-hero-image home-hero-image--${contenido.posicionImagen}`}
            src={resolverUrlImagen(imagenHero)}
            alt=""
            fetchPriority="high"
          />
        )}
        <div className="container home-hero-copy">
          {contenido.etiqueta && <p className="home-hero-tag">{contenido.etiqueta}</p>}
          <h1 id="hero-title" className="display">{contenido.titulo}</h1>
          <Link to={contenido.enlaceBoton} className="btn btn--red">{contenido.textoBoton}</Link>
        </div>
      </section>

      <ul className="container home-benefits" aria-label="Por qué comprar en Drop Store">
        {BENEFICIOS.map(([icono, titulo, detalle]) => (
          <li key={titulo}>
            <Icon name={icono} size={24} />
            <span><strong>{titulo}</strong>{detalle}</span>
          </li>
        ))}
      </ul>

      <section className="container home-section" aria-labelledby="categorias-title">
        <h2 id="categorias-title" className="home-heading">Comprar por categoría</h2>
        <ul className="home-categories">
          {categorias.map((categoria) => (
            <li key={categoria.label}>
              <Link to={categoria.to} className="home-category">
                <span className="home-category-label">{categoria.label}</span>
                {!cargando && (
                  <span className="home-category-count">
                    {categoria.total} {categoria.total === 1 ? 'modelo' : 'modelos'}
                  </span>
                )}
                <Icon name="arrowRight" size={28} className="home-category-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container home-section" aria-labelledby="mas-vendidos-title">
        <div className="home-section-head">
          <h2 id="mas-vendidos-title" className="home-heading">Lo más vendido</h2>
          <Link to="/catalogo" className="link">Ver todo el catálogo</Link>
        </div>

        {cargando && (
          <div className="product-grid" role="status" aria-label="Cargando productos">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}
        {!cargando && destacados.length === 0 && (
          <p className="home-empty">Todavía no hay zapatillas con stock. Vuelve pronto.</p>
        )}
        {destacados.length > 0 && (
          <ul className="product-grid">
            {destacados.map((producto) => (
              <li key={producto.id}>
                <ProductCard
                  producto={producto}
                  calificacion={calificaciones[producto.id]}
                  puesto={puestoEnRanking.has(producto.id) ? puestoEnRanking.get(producto.id) + 1 : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {enFoco && (
        <section className="home-spotlight" aria-labelledby="spotlight-title">
          <div className="home-spotlight-media">
            <img src={resolverUrlImagen(enFoco.foto)} alt={enFoco.nombre} loading="lazy" />
            {enFoco.modelo && <span className="product-card-code">{enFoco.modelo}</span>}
          </div>
          <div className="home-spotlight-copy">
            <p className="home-spotlight-brand">{enFoco.marcaPrincipal}</p>
            <h2 id="spotlight-title" className="display">{enFoco.nombre}</h2>
            {enFoco.descripcion && <p className="home-spotlight-text">{enFoco.descripcion}</p>}
            <dl className="home-spotlight-facts">
              <div><dt>Precio</dt><dd>{soles(enFoco.prcio_venta)}</dd></div>
              <div><dt>Disponible</dt><dd>{resumenTallas(enFoco.variantes)}</dd></div>
            </dl>
            <Link to={`/producto/${enFoco.id}`} className="btn btn--light">Ver producto</Link>
          </div>
        </section>
      )}

      {recienLlegados.length > 0 && (
        <section className="container home-section" aria-labelledby="novedades-title">
          <div className="home-section-head">
            <h2 id="novedades-title" className="home-heading">Recién llegados</h2>
            <Link to="/catalogo" className="link">Ver todo el catálogo</Link>
          </div>
          <ul className="product-grid">
            {recienLlegados.map((producto) => (
              <li key={producto.id}><ProductCard producto={producto} /></li>
            ))}
          </ul>
        </section>
      )}

      <section className="container home-newsletter" aria-labelledby="newsletter-title">
        <div>
          <h2 id="newsletter-title" className="home-heading">Entérate antes de cada lanzamiento</h2>
          <p>Un correo cuando llegan modelos nuevos o reponemos tallas. Nada más.</p>
        </div>
        {suscrito ? (
          <p className="notice notice--ok" role="status">Listo. Te escribiremos cuando haya novedades.</p>
        ) : (
          <form onSubmit={suscribirse} className="home-newsletter-form">
            <label className="visually-hidden" htmlFor="newsletter-email">Correo electrónico</label>
            <input
              id="newsletter-email"
              className="input"
              type="email"
              required
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
            />
            <button type="submit" className="btn btn--primary">Suscribirme</button>
          </form>
        )}
      </section>
    </div>
  );
}

export default Home;
