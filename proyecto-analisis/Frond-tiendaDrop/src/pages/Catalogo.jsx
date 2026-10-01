import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import InventoryService from '../services/inventory.service';
import { CartContext } from './CartContext.jsx';
import '../css/Catalogo.css';

const API_URL = 'http://localhost:8081/api';

function Catalogo() {
  const { genero } = useParams();
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroGenero, setFiltroGenero] = useState(genero || '');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [modalProducto, setModalProducto] = useState(null);

  const agruparPorProducto = (detalles) => {
    const agrupados = {};
    detalles.forEach((detalle) => {
      const productoId = detalle.producto.id;
      if (!agrupados[productoId]) {
        agrupados[productoId] = { ...detalle.producto, marcaPrincipal: detalle.marca?.nombre || 'N/A', variantes: [] };
      }
      agrupados[productoId].variantes.push(detalle);
    });
    return Object.values(agrupados);
  };

  const cargarProductos = useCallback(async (generoSeleccionado, marcaSeleccionada) => {
    setCargando(true);
    setError('');
    const params = new URLSearchParams();
    if (generoSeleccionado) params.append('genero', generoSeleccionado);
    if (marcaSeleccionada) params.append('marca', marcaSeleccionada);
    try {
      const response = await axios.get(`${API_URL}/productos?${params.toString()}`, { withCredentials: true });
      setProductos(agruparPorProducto(response.data));
    } catch (requestError) {
      console.error('Error al cargar el catálogo:', requestError);
      setError('No pudimos cargar el catálogo. Inténtalo nuevamente.');
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos(filtroGenero, filtroMarca);
  }, [cargarProductos, filtroGenero, filtroMarca]);

  useEffect(() => {
    InventoryService.getAllMarcas().then((response) => setMarcas(response.data)).catch((requestError) => console.error('Error al cargar las marcas:', requestError));
  }, []);

  useEffect(() => setFiltroGenero(genero || ''), [genero]);

  const seleccionarGenero = (nuevoGenero) => {
    const valor = filtroGenero === nuevoGenero ? '' : nuevoGenero;
    setFiltroGenero(valor);
    navigate(valor ? `/catalogo/${valor}` : '/catalogo');
  };

  const getImageUrl = (path) => path?.startsWith('/uploads') ? `http://localhost:8081${path}` : path;

  const agregarAlCarrito = (variante) => {
    addItem(modalProducto, variante);
    setModalProducto(null);
  };

  return (
    <section className="catalog-page" aria-labelledby="catalog-title">
      <p className="catalog-breadcrumb">Inicio &gt; Catálogo</p>
      <header className="catalog-header"><h1 id="catalog-title">Catálogo{filtroGenero ? ` · ${filtroGenero}` : ''}</h1></header>

      <details className="catalog-filters">
        <summary>Filtrar y ordenar</summary>
        <div className="catalog-filter-content">
          <div className="catalog-filter-group">
            <strong>Género</strong>
            {['Mujer', 'Hombre', 'Unisex'].map((opcion) => <button key={opcion} type="button" aria-pressed={filtroGenero === opcion} onClick={() => seleccionarGenero(opcion)}>{opcion}</button>)}
          </div>
          <div className="catalog-filter-group">
            <strong>Marca</strong>
            {marcas.map((marca) => <button key={marca.id} type="button" aria-pressed={filtroMarca === marca.nombre} onClick={() => setFiltroMarca(filtroMarca === marca.nombre ? '' : marca.nombre)}>{marca.nombre}</button>)}
            {(filtroGenero || filtroMarca) && <button className="catalog-clear" type="button" onClick={() => { setFiltroGenero(''); setFiltroMarca(''); navigate('/catalogo'); }}>Limpiar</button>}
          </div>
        </div>
      </details>

      {cargando && <p className="catalog-feedback" role="status">Cargando productos…</p>}
      {error && <p className="catalog-feedback catalog-feedback--error" role="alert">{error}</p>}
      {!cargando && !error && productos.length === 0 && <p className="catalog-feedback">Aún no hay productos que coincidan con estos filtros.</p>}

      {!cargando && productos.length > 0 && <div className="catalog-grid">
        {productos.map((producto) => (
          <article className="catalog-card" key={producto.id}>
            <div className="catalog-card-image"><img src={getImageUrl(producto.foto)} alt={producto.nombre || 'Producto'} onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /></div>
            <div className="catalog-card-content">
              <p className="catalog-card-brand">{producto.marcaPrincipal}</p>
              <h2>{producto.nombre || 'Producto sin nombre'}</h2>
              <p className="catalog-card-model">{producto.modelo || 'Modelo Drop Store'}</p>
              <p className="catalog-card-rating" aria-label="Calificación 5 de 5">★★★★★ <span>5.0/5</span></p>
              <p className="catalog-card-price">S/ {producto.prcio_venta?.toFixed(2) || '0.00'}</p>
              <div className="catalog-sizes" aria-label="Tallas disponibles">{producto.variantes.map((variante) => <span className="catalog-size" key={variante.id}>{variante.talla}</span>)}</div>
              <button className="catalog-add-button" type="button" onClick={() => setModalProducto(producto)}>Agregar al carrito</button>
            </div>
          </article>
        ))}
      </div>}

      {modalProducto && <div className="size-modal-backdrop" role="presentation" onMouseDown={() => setModalProducto(null)}>
        <section className="size-modal" role="dialog" aria-modal="true" aria-labelledby="size-modal-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className="size-modal-close" type="button" onClick={() => setModalProducto(null)} aria-label="Cerrar">×</button>
          <h2 id="size-modal-title">Elige tu talla</h2>
          <p>{modalProducto.nombre}</p>
          <div className="size-modal-options">{modalProducto.variantes.map((variante) => <button type="button" key={variante.id} onClick={() => agregarAlCarrito(variante)}>{variante.talla}<small> Stock: {variante.stock}</small></button>)}</div>
        </section>
      </div>}
    </section>
  );
}

export default Catalogo;
