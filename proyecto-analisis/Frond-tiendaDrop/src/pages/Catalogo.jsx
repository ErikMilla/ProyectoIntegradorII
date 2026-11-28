import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import InventoryService from '../services/inventory.service';
import StockService from '../services/stock.service';
import { agruparPorProducto } from '../utils/productGrouping';
import { talla as formatoTalla } from '../utils/formato';
import { coincideColor, coincideTexto } from '../utils/busqueda';
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

const precio = (valor) => `S/ ${Number(valor)}`;

/** Los valores de la barra de filtros que corresponden a una interpretación. */
const filtrosDesde = (interpretacion) => ({
  genero: interpretacion.genero || '',
  marca: interpretacion.marca || '',
  categoria: interpretacion.categoria || '',
  color: interpretacion.color || '',
  talla: interpretacion.talla ? formatoTalla(interpretacion.talla) : '',
  precioMinimo: interpretacion.precioMinimo ? String(interpretacion.precioMinimo) : '',
  precioMaximo: interpretacion.precioMaximo ? String(interpretacion.precioMaximo) : '',
  orden: ORDENES[interpretacion.orden] ? interpretacion.orden : 'relevancia',
});

/** Resume en palabras lo que el buscador entendió de la frase. */
const describirInterpretacion = (interpretacion) => {
  const { genero, marca, categoria, color, talla, precioMinimo, precioMaximo, orden } = interpretacion;
  let rango = null;
  if (precioMinimo && precioMaximo) rango = `${precio(precioMinimo)} – ${precio(precioMaximo)}`;
  else if (precioMaximo) rango = `Hasta ${precio(precioMaximo)}`;
  else if (precioMinimo) rango = `Desde ${precio(precioMinimo)}`;
  return [
    genero,
    marca,
    categoria,
    color,
    talla && `Talla ${formatoTalla(talla)}`,
    rango,
    orden && ORDENES[orden] && ORDENES[orden].label,
  ].filter(Boolean);
};

/**
 * Catálogo público de la tienda.
 *
 * El backend devuelve una fila por talla; agruparPorProducto() las junta por
 * modelo para que cada tarjeta muestre un producto. Elegir talla y cantidad se
 * hace en la ficha del producto (/producto/:id).
 *
 * Búsqueda en lenguaje natural: la frase de ?q= se envía a
 * /productos/interpretar, que la convierte en los mismos filtros de la barra
 * lateral (género, marca, color, talla, precio...). Así el cliente ve qué se
 * entendió en los chips y puede quitar lo que no quería. Si el servidor no
 * responde, la frase se busca como texto, igual que antes.
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
  const [precioMinimo, setPrecioMinimo] = useState('');
  const [talla, setTalla] = useState('');
  const [color, setColor] = useState('');
  const [orden, setOrden] = useState('relevancia');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [interpretacion, setInterpretacion] = useState(null);
  const [interpretando, setInterpretando] = useState(false);

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

  // Cada frase nueva del buscador reemplaza los filtros por los que se entendieron.
  useEffect(() => {
    const consulta = busqueda.trim();
    if (!consulta) {
      setInterpretacion(null);
      setInterpretando(false);
      return undefined;
    }
    let vigente = true;
    setInterpretando(true);
    InventoryService.interpretarBusqueda(consulta)
      .then(({ data }) => {
        if (!vigente) return;
        const filtros = filtrosDesde(data);
        setInterpretacion(data);
        setFiltroGenero(filtros.genero);
        setFiltroMarca(filtros.marca);
        setFiltroCategoria(filtros.categoria);
        setColor(filtros.color);
        setTalla(filtros.talla);
        setPrecioMinimo(filtros.precioMinimo);
        setPrecioMaximo(filtros.precioMaximo);
        setOrden(filtros.orden);
      })
      .catch((errorPeticion) => {
        console.error('No se pudo interpretar la búsqueda; se usa como texto:', errorPeticion);
        if (vigente) setInterpretacion(null);
      })
      .finally(() => {
        if (vigente) setInterpretando(false);
      });
    return () => { vigente = false; };
  }, [busqueda]);

  // Mientras llega la interpretación, o si falló, la frase entera se busca como texto.
  const interpretacionVigente = interpretacion?.consulta === busqueda.trim() ? interpretacion : null;
  const textoBuscado = interpretacionVigente ? interpretacionVigente.texto : busqueda.trim();
  // El resumen solo se muestra mientras los filtros sigan siendo los de la frase;
  // si el cliente quita o cambia uno, los chips ya cuentan la situación real.
  const deLaFrase = interpretacionVigente && filtrosDesde(interpretacionVigente);
  const filtrosSinCambios = deLaFrase
    && deLaFrase.genero === filtroGenero && deLaFrase.marca === filtroMarca
    && deLaFrase.categoria === filtroCategoria && deLaFrase.color === color
    && deLaFrase.talla === talla && deLaFrase.precioMinimo === precioMinimo
    && deLaFrase.precioMaximo === precioMaximo && deLaFrase.orden === orden;
  const entendido = filtrosSinCambios ? describirInterpretacion(interpretacionVigente) : [];

  const seleccionarGenero = (nuevoGenero) => {
    const valor = filtroGenero === nuevoGenero ? '' : nuevoGenero;
    setFiltroGenero(valor);
    // Se conserva la búsqueda (?q=) al cambiar de género.
    const consulta = searchParams.toString();
    navigate({ pathname: valor ? `/catalogo/${valor}` : '/catalogo', search: consulta ? `?${consulta}` : '' });
  };

  const quitarBusqueda = () => {
    const siguientes = new URLSearchParams(searchParams);
    siguientes.delete('q');
    setSearchParams(siguientes);
  };

  const limpiarFiltros = () => {
    setFiltroGenero('');
    setFiltroMarca('');
    setFiltroCategoria('');
    setPrecioMaximo('');
    setPrecioMinimo('');
    setTalla('');
    setColor('');
    navigate('/catalogo');
  };

  const productosVisibles = useMemo(() => {
    const filtrados = productos.filter((producto) => {
      const precioVenta = Number(producto.prcio_venta);
      const coincideCategoria = !filtroCategoria || producto.categoria_id?.nombre === filtroCategoria;
      const coincidePrecio = (!precioMaximo || precioVenta <= Number(precioMaximo))
        && (!precioMinimo || precioVenta >= Number(precioMinimo));
      // Talla y color se piden a la misma variante: "blancas talla 38" no acepta
      // un modelo que tenga la 38 solo en negro.
      const coincideVariante = (!talla && !color) || producto.variantes.some((variante) => (
        coincideColor(variante.color, color)
        && (!talla || (variante.stock > 0 && formatoTalla(variante.talla) === talla))
      ));
      return coincideCategoria && coincidePrecio && coincideVariante && coincideTexto(producto, textoBuscado);
    });
    const { comparar } = ORDENES[orden];
    return comparar ? [...filtrados].sort(comparar) : filtrados;
  }, [productos, textoBuscado, filtroCategoria, precioMaximo, precioMinimo, talla, color, orden]);

  const tallasDisponibles = useMemo(() => [...new Set(
    productos.flatMap((producto) => producto.variantes.filter((v) => v.stock > 0).map((v) => formatoTalla(v.talla))),
  )].sort((a, b) => Number(a) - Number(b)), [productos]);

  const filtrosActivos = [
    filtroGenero && { id: 'genero', label: filtroGenero, quitar: () => seleccionarGenero(filtroGenero) },
    filtroMarca && { id: 'marca', label: filtroMarca, quitar: () => setFiltroMarca('') },
    filtroCategoria && { id: 'categoria', label: filtroCategoria, quitar: () => setFiltroCategoria('') },
    color && { id: 'color', label: color, quitar: () => setColor('') },
    talla && { id: 'talla', label: `Talla ${talla}`, quitar: () => setTalla('') },
    precioMinimo && { id: 'precio-minimo', label: `Desde ${precio(precioMinimo)}`, quitar: () => setPrecioMinimo('') },
    precioMaximo && { id: 'precio', label: `Hasta ${precio(precioMaximo)}`, quitar: () => setPrecioMaximo('') },
  ].filter(Boolean);

  const titulo = filtroGenero || 'Todas las zapatillas';
  const ocupado = cargando || interpretando;

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
            {ocupado ? 'Buscando modelos…' : `${productosVisibles.length} ${productosVisibles.length === 1 ? 'modelo' : 'modelos'}`}
            {!ocupado && textoBuscado && <> para «{textoBuscado}»</>}
          </p>
          {!ocupado && entendido.length > 0 && (
            <p className="catalog-interpretation">
              Entendimos «{interpretacionVigente.consulta}» como <strong>{entendido.join(' · ')}</strong>
            </p>
          )}
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

      {(filtrosActivos.length > 0 || textoBuscado) && (
        <ul className="catalog-chips" aria-label="Filtros aplicados">
          {textoBuscado && (
            <li>
              <button type="button" onClick={quitarBusqueda}>
                «{textoBuscado}» <Icon name="close" size={14} label="Quitar búsqueda" />
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

          {ocupado && !error && (
            <div className="product-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}

          {!ocupado && !error && productosVisibles.length === 0 && (
            <div className="catalog-message">
              <h2>No hay modelos con estos filtros</h2>
              <p>Prueba con otra talla, sube el precio máximo o quita algún filtro.</p>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => { limpiarFiltros(); setSearchParams({}); }}>
                Ver todo el catálogo
              </button>
            </div>
          )}

          {!ocupado && productosVisibles.length > 0 && (
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
