import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import InventoryService from '../services/inventory.service';
import StockService from '../services/stock.service';
import { agruparPorProducto } from '../utils/productGrouping';
import { talla as formatoTalla } from '../utils/formato';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import Icon from '../components/Icon';
import '../css/Catalogo.css';

const GENEROS = ['Hombre', 'Mujer', 'Niños', 'Unisex'];

const ORDENES = {
  relevancia: { label: 'Destacados', comparar: null },
  'precio-asc': { label: 'Precio: menor a mayor', comparar: (a, b) => a.prcio_venta - b.prcio_venta },
  'precio-desc': { label: 'Precio: mayor a menor', comparar: (a, b) => b.prcio_venta - a.prcio_venta },
  nombre: { label: 'Nombre: A–Z', comparar: (a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es') },
};

/**
 * Catálogo público de la tienda.
 *
 * El backend devuelve una fila por talla; agruparPorProducto() las junta por
 * modelo para que cada tarjeta muestre un producto. Elegir talla y cantidad se
 * hace en la ficha del producto (/producto/:id).
 */
function Catalogo() {
  const { genero } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get('q') || '';

  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroGenero, setFiltroGenero] = useState(genero || '');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [precioMaximo, setPrecioMaximo] = useState('');
  const [talla, setTalla] = useState('');
  const [orden, setOrden] = useState('relevancia');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const cargarProductos = useCallback(async (generoSeleccionado, marcaSeleccionada) => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await InventoryService.getAllProductos({
        genero: generoSeleccionado,
        marca: marcaSeleccionada,
      });
      setProductos(agruparPorProducto(respuesta.data));
    } catch (errorPeticion) {
      console.error('Error al cargar el catálogo:', errorPeticion);
      setError('No pudimos cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.');
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos(filtroGenero, filtroMarca);
  }, [cargarProductos, filtroGenero, filtroMarca]);

  useEffect(() => StockService.suscribir(
    () => cargarProductos(filtroGenero, filtroMarca),
  ), [cargarProductos, filtroGenero, filtroMarca]);

  useEffect(() => {
    InventoryService.getAllMarcas()
      .then((respuesta) => setMarcas(respuesta.data))
      .catch((errorPeticion) => console.error('Error al cargar las marcas:', errorPeticion));
    InventoryService.getAllCategorias()
      .then((respuesta) => setCategorias(respuesta.data))
      .catch((errorPeticion) => console.error('Error al cargar las categorías:', errorPeticion));
  }, []);

  // En móvil el panel de filtros ocupa la pantalla: Escape lo cierra.
  useEffect(() => {
    if (!filtrosAbiertos) return undefined;
    const alPresionar = (evento) => { if (evento.key === 'Escape') setFiltrosAbiertos(false); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [filtrosAbiertos]);

  // Si el usuario llega por /catalogo/Mujer, el filtro sigue a la URL.
  useEffect(() => setFiltroGenero(genero || ''), [genero]);

  const seleccionarGenero = (nuevoGenero) => {
    const valor = filtroGenero === nuevoGenero ? '' : nuevoGenero;
    setFiltroGenero(valor);
    navigate(valor ? `/catalogo/${valor}` : '/catalogo');
  };

  const limpiarFiltros = () => {
    setFiltroGenero('');
    setFiltroMarca('');
    setFiltroCategoria('');
    setPrecioMaximo('');
    setTalla('');
    navigate('/catalogo');
  };

  const productosVisibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const filtrados = productos.filter((producto) => {
      const coincideCategoria = !filtroCategoria || producto.categoria_id?.nombre === filtroCategoria;
      const coincidePrecio = !precioMaximo || Number(producto.prcio_venta) <= Number(precioMaximo);
      const coincideTalla = !talla || producto.variantes.some(
        (variante) => variante.stock > 0 && formatoTalla(variante.talla) === talla,
      );
      if (!coincideCategoria || !coincidePrecio || !coincideTalla) return false;
      if (!termino) return true;
      const texto = `${producto.nombre || ''} ${producto.modelo || ''} ${producto.marcaPrincipal || ''}`.toLowerCase();
      return texto.includes(termino);
    });
    const { comparar } = ORDENES[orden];
    return comparar ? [...filtrados].sort(comparar) : filtrados;
  }, [productos, busqueda, filtroCategoria, precioMaximo, talla, orden]);

  const tallasDisponibles = useMemo(() => [...new Set(
    productos.flatMap((producto) => producto.variantes.filter((v) => v.stock > 0).map((v) => formatoTalla(v.talla))),
  )].sort((a, b) => Number(a) - Number(b)), [productos]);

  const filtrosActivos = [
    filtroGenero && { id: 'genero', label: filtroGenero, quitar: () => seleccionarGenero(filtroGenero) },
    filtroMarca && { id: 'marca', label: filtroMarca, quitar: () => setFiltroMarca('') },
    filtroCategoria && { id: 'categoria', label: filtroCategoria, quitar: () => setFiltroCategoria('') },
    talla && { id: 'talla', label: `Talla ${talla}`, quitar: () => setTalla('') },
    precioMaximo && { id: 'precio', label: `Hasta S/ ${precioMaximo}`, quitar: () => setPrecioMaximo('') },
  ].filter(Boolean);

  const titulo = filtroGenero || 'Todas las zapatillas';

  return (
    <div className="container catalog">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <ol>
          <li><Link to="/">Inicio</Link></li>
          {filtroGenero ? (
            <>
              <li><Link to="/catalogo">Catálogo</Link></li>
              <li><span aria-current="page">{filtroGenero}</span></li>
            </>
          ) : (
            <li><span aria-current="page">Catálogo</span></li>
          )}
        </ol>
      </nav>

      <header className="catalog-head">
        <div>
          <h1 className="page-title">{titulo}</h1>
          <p className="catalog-count" role="status">
            {cargando ? 'Buscando modelos…' : `${productosVisibles.length} ${productosVisibles.length === 1 ? 'modelo' : 'modelos'}`}
            {busqueda && <> para «{busqueda}»</>}
          </p>
        </div>

        <div className="catalog-tools">
          <button
            type="button"
            className="btn btn--outline btn--sm catalog-filter-toggle"
            aria-expanded={filtrosAbiertos}
            aria-controls="catalog-filters"
            onClick={() => setFiltrosAbiertos((abierto) => !abierto)}
          >
            <Icon name="filter" size={18} />
            Filtros{filtrosActivos.length > 0 && ` (${filtrosActivos.length})`}
          </button>
          <label className="catalog-sort">
            <span>Ordenar por</span>
            <select className="input" value={orden} onChange={(evento) => setOrden(evento.target.value)}>
              {Object.entries(ORDENES).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
            </select>
          </label>
        </div>
      </header>

      {(filtrosActivos.length > 0 || busqueda) && (
        <ul className="catalog-chips" aria-label="Filtros aplicados">
          {busqueda && (
            <li>
              <button type="button" onClick={() => setSearchParams({})}>
                «{busqueda}» <Icon name="close" size={14} label="Quitar búsqueda" />
              </button>
            </li>
          )}
          {filtrosActivos.map((filtro) => (
            <li key={filtro.id}>
              <button type="button" onClick={filtro.quitar}>
                {filtro.label} <Icon name="close" size={14} label={`Quitar ${filtro.label}`} />
              </button>
            </li>
          ))}
          {filtrosActivos.length > 1 && (
            <li><button type="button" className="catalog-chips-clear" onClick={limpiarFiltros}>Quitar todos</button></li>
          )}
        </ul>
      )}

      <div className="catalog-layout">
        <aside id="catalog-filters" className={`catalog-filters${filtrosAbiertos ? ' is-open' : ''}`} aria-label="Filtros">
          <div className="catalog-filters-head">
            <h2>Filtros</h2>
            <button type="button" className="site-action" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros">
              <Icon name="close" />
            </button>
          </div>
          <FiltroOpciones
            titulo="Género"
            opciones={GENEROS.map((g) => [g, g])}
            activo={filtroGenero}
            alElegir={seleccionarGenero}
          />
          <FiltroOpciones
            titulo="Marca"
            opciones={marcas.map((m) => [m.nombre, m.nombre])}
            activo={filtroMarca}
            alElegir={(valor) => setFiltroMarca(filtroMarca === valor ? '' : valor)}
          />
          <FiltroOpciones
            titulo="Categoría"
            opciones={categorias.map((c) => [c.nombre, c.nombre])}
            activo={filtroCategoria}
            alElegir={(valor) => setFiltroCategoria(filtroCategoria === valor ? '' : valor)}
          />

          {tallasDisponibles.length > 0 && (
            <fieldset className="catalog-filter">
              <legend>Talla (EU)</legend>
              <div className="catalog-sizes">
                {tallasDisponibles.map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    aria-pressed={talla === opcion}
                    onClick={() => setTalla(talla === opcion ? '' : opcion)}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="catalog-filter">
            <label className="catalog-filter-title" htmlFor="precio-maximo">Precio máximo</label>
            <div className="catalog-price">
              <span aria-hidden="true">S/</span>
              <input
                id="precio-maximo"
                className="input"
                type="number"
                inputMode="numeric"
                min="0"
                step="10"
                value={precioMaximo}
                onChange={(evento) => setPrecioMaximo(evento.target.value)}
                placeholder="Sin límite"
              />
            </div>
          </div>

          <button type="button" className="btn btn--primary btn--block catalog-filters-done" onClick={() => setFiltrosAbiertos(false)}>
            Ver {productosVisibles.length} {productosVisibles.length === 1 ? 'modelo' : 'modelos'}
          </button>
        </aside>

        <section className="catalog-results" aria-label="Resultados">
          {error && (
            <div className="catalog-message">
              <p className="notice notice--error" role="alert">{error}</p>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => cargarProductos(filtroGenero, filtroMarca)}>
                Reintentar
              </button>
            </div>
          )}

          {cargando && !error && (
            <div className="product-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}

          {!cargando && !error && productosVisibles.length === 0 && (
            <div className="catalog-message">
              <h2>No hay modelos con estos filtros</h2>
              <p>Prueba con otra talla, sube el precio máximo o quita algún filtro.</p>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => { limpiarFiltros(); setSearchParams({}); }}>
                Ver todo el catálogo
              </button>
            </div>
          )}

          {!cargando && productosVisibles.length > 0 && (
            <ul className="product-grid">
              {productosVisibles.map((producto) => (
                <li key={producto.id}><ProductCard producto={producto} nivel="h2" /></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** Grupo de botones de un filtro; un toque activa, otro toque desactiva. */
function FiltroOpciones({ titulo, opciones, activo, alElegir }) {
  if (opciones.length === 0) return null;
  return (
    <fieldset className="catalog-filter">
      <legend>{titulo}</legend>
      <div className="catalog-options">
        {opciones.map(([valor, label]) => (
          <button key={valor} type="button" aria-pressed={activo === valor} onClick={() => alElegir(valor)}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default Catalogo;
