import { useEffect, useMemo, useState } from 'react';
import InventoryService from '../../services/inventory.service';
import { agruparPorProducto } from '../../utils/productGrouping';
import { mensajeDeError, resolverUrlImagen } from '../../services/api';
import CatalogoSimple from './CatalogoSimple';
import StockService from '../../services/stock.service';

/**
 * Gestion completa del catalogo: productos con sus tallas, marcas y categorias.
 *
 * Esta pantalla la usan tanto el administrador como el almacenero. Antes habia
 * dos versiones distintas del mismo formulario (una en cada panel) que se
 * fueron desincronizando; ahora es una sola.
 *
 * Vocabulario:
 *   producto -> el modelo (ej. "Nike Air Force 1 07")
 *   variante -> una talla concreta de ese modelo, con su propio stock
 */

const varianteVacia = () => ({ marcaId: '', talla: '', stock: '', color: '', genero: 'Unisex' });

const productoVacio = () => ({
  nombre: '',
  modelo: '',
  precioCompra: '',
  precioVenta: '',
  descripcion: '',
  categoriaId: '',
  variantes: [varianteVacia()],
  archivo: null,
});

function GestionInventario() {
  const [pestana, setPestana] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [formulario, setFormulario] = useState(productoVacio);
  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const [resProductos, resCategorias, resMarcas] = await Promise.all([
        InventoryService.getAllProductos(),
        InventoryService.getAllCategorias(),
        InventoryService.getAllMarcas(),
      ]);
      setProductos(agruparPorProducto(resProductos.data));
      setCategorias(resCategorias.data || []);
      setMarcas(resMarcas.data || []);
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo cargar el inventario desde la base de datos.'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => StockService.suscribir(cargar), []);

  const recargarCatalogos = async () => {
    const [resCategorias, resMarcas] = await Promise.all([
      InventoryService.getAllCategorias(),
      InventoryService.getAllMarcas(),
    ]);
    setCategorias(resCategorias.data || []);
    setMarcas(resMarcas.data || []);
  };

  const productosVisibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return productos;
    return productos.filter((p) => `${p.nombre} ${p.modelo}`.toLowerCase().includes(termino));
  }, [productos, busqueda]);

  // ---------------------------------------------------------------- variantes

  const cambiarVariante = (indice, campo, valor) => setFormulario((actual) => ({
    ...actual,
    variantes: actual.variantes.map((variante, posicion) => (
      posicion === indice ? { ...variante, [campo]: valor } : variante
    )),
  }));

  const agregarVariante = () => setFormulario((actual) => ({
    ...actual,
    variantes: [...actual.variantes, varianteVacia()],
  }));

  const quitarVariante = (indice) => setFormulario((actual) => ({
    ...actual,
    variantes: actual.variantes.filter((_, posicion) => posicion !== indice),
  }));

  // ---------------------------------------------------------------- acciones

  const editar = async (id) => {
    try {
      const { producto, variantes } = (await InventoryService.getProductoConVariantes(id)).data;
      setEditandoId(id);
      setFormulario({
        nombre: producto.nombre || '',
        modelo: producto.modelo || '',
        precioCompra: producto.precioCompra ?? '',
        precioVenta: producto.precioVenta ?? '',
        descripcion: producto.descripcion || '',
        categoriaId: String(producto.categoriaId || ''),
        archivo: null,
        variantes: variantes.map((variante) => ({
          id: variante.id,
          marcaId: String(variante.marcaId || ''),
          talla: String(variante.talla),
          stock: String(variante.stock),
          color: variante.color || '',
          genero: variante.genero || 'Unisex',
        })),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo cargar el producto para editar.'));
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario(productoVacio());
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje('');

    if (!categorias.length || !marcas.length) {
      setMensaje('Primero crea al menos una categoría y una marca.');
      return;
    }
    if (!editandoId && !formulario.archivo) {
      setMensaje('Selecciona una imagen para el producto.');
      return;
    }

    const payload = {
      producto: {
        nombre: formulario.nombre.trim(),
        modelo: formulario.modelo.trim(),
        precioCompra: Number(formulario.precioCompra),
        precioVenta: Number(formulario.precioVenta),
        descripcion: formulario.descripcion.trim(),
        categoriaId: Number(formulario.categoriaId),
      },
      variantes: formulario.variantes.map((variante) => ({
        id: variante.id || null,
        marcaId: Number(variante.marcaId),
        talla: Number(variante.talla),
        stock: Number(variante.stock),
        color: variante.color.trim(),
        genero: variante.genero,
      })),
    };

    try {
      if (editandoId) {
        await InventoryService.updateProducto(editandoId, payload);
      } else {
        await InventoryService.createProducto(payload, formulario.archivo);
      }
      cancelarEdicion();
      await cargar();
      setMensaje('Producto guardado correctamente.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo guardar el producto. Revisa los campos.'));
    }
  };

  const eliminar = async (producto) => {
    if (!window.confirm(`¿Eliminar ${producto.nombre} y todas sus tallas?`)) return;
    try {
      await InventoryService.deleteProduct(producto.id);
      await cargar();
      setMensaje('Producto eliminado.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo eliminar el producto.'));
    }
  };

  const faltanCatalogos = !categorias.length || !marcas.length;

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Inventario</h1>
        </div>
        {pestana === 'productos' && (
          <label className="admin-search">
            <span>⌕</span>
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar producto"
            />
          </label>
        )}
      </header>

      <nav className="section-tabs" aria-label="Secciones de inventario">
        <button className={pestana === 'productos' ? 'active' : ''} onClick={() => setPestana('productos')}>
          Productos y tallas
        </button>
        <button className={pestana === 'marcas' ? 'active' : ''} onClick={() => setPestana('marcas')}>
          Marcas <span>{marcas.length}</span>
        </button>
        <button className={pestana === 'categorias' ? 'active' : ''} onClick={() => setPestana('categorias')}>
          Categorías <span>{categorias.length}</span>
        </button>
      </nav>

      {mensaje && <div className="admin-notice" role="status">{mensaje}</div>}

      {pestana === 'marcas' && (
        <CatalogoSimple
          titulo="Marca"
          ejemplo="Nike"
          items={marcas}
          onCrear={InventoryService.createMarca}
          onActualizar={InventoryService.updateMarca}
          onEliminar={InventoryService.deleteMarca}
          onCambio={recargarCatalogos}
        />
      )}

      {pestana === 'categorias' && (
        <CatalogoSimple
          titulo="Categoría"
          ejemplo="Urbano"
          items={categorias}
          onCrear={InventoryService.createCategoria}
          onActualizar={InventoryService.updateCategoria}
          onEliminar={InventoryService.deleteCategoria}
          onCambio={recargarCatalogos}
        />
      )}

      {pestana === 'productos' && (
        <div className="inventory-workspace">
          <div className="data-card">
            {cargando ? (
              <div className="empty-state">Cargando inventario…</div>
            ) : productosVisibles.length === 0 ? (
              <div className="empty-state">
                <strong>No hay productos registrados</strong>
                <span>Crea marcas y categorías, luego registra tu primer producto con una talla.</span>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Variantes</th>
                      <th>Stock total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosVisibles.map((producto) => (
                      <tr key={producto.id}>
                        <td>
                          <div className="product-cell">
                            {producto.foto
                              ? <img src={resolverUrlImagen(producto.foto)} alt="" />
                              : <span className="product-placeholder">DROP</span>}
                            <span>
                              <strong>{producto.nombre}</strong>
                              <small>{producto.modelo || 'Sin modelo'}</small>
                            </span>
                          </div>
                        </td>
                        <td>S/{Number(producto.prcio_venta || 0).toFixed(2)}</td>
                        <td>
                          {producto.variantes
                            .map((v) => `${v.talla} · ${v.marca?.nombre || 'Sin marca'}`)
                            .join(', ')}
                        </td>
                        <td>{producto.variantes.reduce((suma, v) => suma + Number(v.stock || 0), 0)}</td>
                        <td>
                          <div className="row-actions">
                            <button onClick={() => editar(producto.id)}>Editar</button>
                            <button className="danger" onClick={() => eliminar(producto)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <form className="editor-card product-editor" onSubmit={guardar}>
            <div className="editor-heading">
              <div>
                <p>{editandoId ? 'EDICIÓN' : 'NUEVO PRODUCTO'}</p>
                <h2>{editandoId ? 'Editar producto' : 'Registrar producto'}</h2>
              </div>
              {editandoId && (
                <button type="button" className="text-button" onClick={cancelarEdicion}>Cancelar</button>
              )}
            </div>

            {faltanCatalogos && (
              <div className="setup-warning">
                Necesitas al menos una marca y una categoría. Créalas en las pestañas superiores.
              </div>
            )}

            <div className="field-grid">
              <label className="full-field">
                Nombre
                <input
                  required
                  value={formulario.nombre}
                  onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
                />
              </label>

              <label>
                Modelo / SKU
                <input
                  required
                  value={formulario.modelo}
                  onChange={(evento) => setFormulario({ ...formulario, modelo: evento.target.value })}
                />
              </label>

              <label>
                Categoría
                <select
                  required
                  value={formulario.categoriaId}
                  onChange={(evento) => setFormulario({ ...formulario, categoriaId: evento.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                </select>
              </label>

              <label>
                Precio compra
                <input
                  required min="0" step="0.01" type="number"
                  value={formulario.precioCompra}
                  onChange={(evento) => setFormulario({ ...formulario, precioCompra: evento.target.value })}
                />
              </label>

              <label>
                Precio venta
                <input
                  required min="0" step="0.01" type="number"
                  value={formulario.precioVenta}
                  onChange={(evento) => setFormulario({ ...formulario, precioVenta: evento.target.value })}
                />
              </label>

              <label className="full-field">
                Descripción
                <textarea
                  required rows="2"
                  value={formulario.descripcion}
                  onChange={(evento) => setFormulario({ ...formulario, descripcion: evento.target.value })}
                />
              </label>

              {!editandoId && (
                <label className="full-field">
                  Imagen
                  <input
                    required type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={(evento) => setFormulario({ ...formulario, archivo: evento.target.files[0] })}
                  />
                </label>
              )}
            </div>

            <div className="variant-heading">
              <div>
                <h3>Tallas, marca y stock</h3>
              </div>
              <button type="button" className="secondary-button" onClick={agregarVariante}>
                + Añadir talla
              </button>
            </div>

            {formulario.variantes.map((variante, indice) => (
              <div className="variant-row" key={indice}>
                <label>
                  Marca
                  <select
                    required
                    value={variante.marcaId}
                    onChange={(evento) => cambiarVariante(indice, 'marcaId', evento.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Talla
                  <input
                    required min="1" step="0.5" type="number"
                    value={variante.talla}
                    onChange={(evento) => cambiarVariante(indice, 'talla', evento.target.value)}
                  />
                </label>

                <label>
                  Stock
                  <input
                    required min="0" type="number"
                    value={variante.stock}
                    onChange={(evento) => cambiarVariante(indice, 'stock', evento.target.value)}
                  />
                </label>

                <label>
                  Color
                  <input
                    required
                    value={variante.color}
                    onChange={(evento) => cambiarVariante(indice, 'color', evento.target.value)}
                  />
                </label>

                <label>
                  Género
                  <select
                    value={variante.genero}
                    onChange={(evento) => cambiarVariante(indice, 'genero', evento.target.value)}
                  >
                    <option>Unisex</option>
                    <option>Hombre</option>
                    <option>Mujer</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="remove-variant"
                  disabled={formulario.variantes.length === 1}
                  onClick={() => quitarVariante(indice)}
                >
                  ×
                </button>
              </div>
            ))}

            <button className="primary-button full-button" type="submit" disabled={faltanCatalogos}>
              {editandoId ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

export default GestionInventario;
