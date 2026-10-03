import { useEffect, useMemo, useRef, useState } from 'react';
import InventoryService from '../../services/inventory.service';
import UserService from '../../services/user.service';
import VentaService from '../../services/venta.service';
import { mensajeDeError, resolverUrlImagen } from '../../services/api';
import StockService from '../../services/stock.service';

const soles = (valor) => `S/${Number(valor || 0).toFixed(2)}`;
const IGV = 0.18;

/** El carrito en curso sobrevive si el vendedor se va a otra sección y vuelve. */
const CLAVE_CARRITO_POS = 'dropstore_pos_carrito';

const clienteVacio = { nombre: '', apellido: '', dni: '', telefono: '', correo: '' };

const leerCarritoGuardado = () => {
  try {
    const guardado = sessionStorage.getItem(CLAVE_CARRITO_POS);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

/**
 * Punto de venta presencial, compartido por el panel de administración y el de
 * vendedor (antes existían dos pantallas distintas que hacían lo mismo).
 *
 * Flujo: se busca el producto, se toca "Agregar", se elige al cliente y se
 * cobra. Al cobrar, el backend descuenta el stock dentro de una transacción,
 * por eso aquí no hace falta tocar el inventario.
 */
function PuntoDeVenta({ onVentaRegistrada }) {
  const [clientes, setClientes] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState(leerCarritoGuardado);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [cupon, setCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Alta rápida de cliente, sin salir de la venta en curso.
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(clienteVacio);
  const [errorCliente, setErrorCliente] = useState('');
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [respuestaClientes, respuestaProductos] = await Promise.all([
        UserService.getClientes(),
        InventoryService.getAllProductos(),
      ]);
      setClientes(respuestaClientes.data || []);
      // Solo tiene sentido vender lo que tiene stock.
      setVariantes((respuestaProductos.data || []).filter((variante) => variante.stock > 0));
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudieron cargar clientes o productos.'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => StockService.suscribir(cargarDatos), []);

  // Guardamos el carrito para que no se pierda al ir a Clientes y volver.
  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_CARRITO_POS, JSON.stringify(carrito));
    } catch {
      // Si el navegador bloquea el almacenamiento, la venta sigue funcionando.
    }
  }, [carrito]);

  /**
   * Resultados de la búsqueda. Sin texto se muestra todo el inventario
   * disponible, que es lo útil cuando el vendedor solo quiere ojear qué hay.
   */
  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return variantes;

    return variantes.filter((variante) => {
      const texto = [
        variante.producto?.nombre,
        variante.producto?.modelo,
        variante.marca?.nombre,
        `talla ${variante.talla}`,
        variante.color,
      ].join(' ').toLowerCase();
      return texto.includes(termino);
    });
  }, [variantes, busqueda]);

  const enCarrito = (varianteId) => carrito.find((item) => item.id === varianteId)?.cantidad || 0;

  const agregar = (variante) => {
    setCarrito((actual) => {
      const existente = actual.find((item) => item.id === variante.id);
      if (existente) {
        return actual.map((item) => (item.id === variante.id
          ? { ...item, cantidad: Math.min(item.cantidad + 1, variante.stock) }
          : item));
      }
      return [...actual, { ...variante, cantidad: 1 }];
    });
  };

  const agregarPorCodigo = (codigo) => {
    const limpio = String(codigo || '').trim().toLowerCase();
    const variante = variantes.find((item) => String(item.id) === limpio)
      || variantes.find((item) => String(item.producto?.modelo || '').toLowerCase() === limpio);
    if (!variante) {
      setMensaje(`No se encontró una variante con el código “${codigo}”.`);
      return false;
    }
    agregar(variante);
    setCodigoBarras('');
    setMensaje(`${variante.producto?.nombre}, talla ${variante.talla}, agregado.`);
    return true;
  };

  const detenerEscaner = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setEscaneando(false);
  };

  const iniciarEscaner = async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      setMensaje('Este navegador no permite usar la cámara. Puedes usar un lector USB o escribir el código.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setEscaneando(true);
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
        const buscar = async () => {
          if (!streamRef.current || !videoRef.current) return;
          const codigos = await detector.detect(videoRef.current).catch(() => []);
          if (codigos[0] && agregarPorCodigo(codigos[0].rawValue)) return detenerEscaner();
          requestAnimationFrame(buscar);
        };
        buscar();
      }, 0);
    } catch {
      detenerEscaner();
      setMensaje('No se pudo abrir la cámara. Revisa sus permisos o usa el ingreso manual.');
    }
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const cambiarCantidad = (id, delta) => setCarrito((actual) => actual.map((item) => {
    if (item.id !== id) return item;
    return { ...item, cantidad: Math.min(item.stock, Math.max(1, item.cantidad + delta)) };
  }));

  const quitar = (id) => setCarrito((actual) => actual.filter((item) => item.id !== id));

  const subtotal = useMemo(
    () => carrito.reduce((suma, item) => suma + Number(item.producto?.prcio_venta || 0) * item.cantidad, 0),
    [carrito],
  );
  const descuento = cuponAplicado ? subtotal * 0.10 : 0;
  const igv = (subtotal - descuento) * IGV;
  const total = subtotal - descuento + igv;

  // ------------------------------------------------------- alta rápida de cliente

  const guardarCliente = async (evento) => {
    evento.preventDefault();
    setErrorCliente('');
    setGuardandoCliente(true);
    try {
      const { data } = await UserService.create({ ...nuevoCliente, rol: 'CLIENTE' });
      const { data: lista } = await UserService.getClientes();
      setClientes(lista || []);
      setClienteId(String(data.id));          // queda seleccionado al instante
      setNuevoCliente(clienteVacio);
      setCreandoCliente(false);
      setMensaje(`Cliente ${data.nombre} creado y seleccionado.`);
    } catch (error) {
      setErrorCliente(mensajeDeError(error, 'No se pudo crear el cliente.'));
    } finally {
      setGuardandoCliente(false);
    }
  };

  const campoCliente = (clave) => ({
    value: nuevoCliente[clave],
    onChange: (evento) => setNuevoCliente({ ...nuevoCliente, [clave]: evento.target.value }),
  });

  // ------------------------------------------------------------------- cobrar

  /** Qué falta para poder cobrar. Vacío significa que ya se puede. */
  const faltante = useMemo(() => {
    if (carrito.length === 0 && !clienteId) return 'Agrega productos y selecciona un cliente para cobrar.';
    if (carrito.length === 0) return 'Agrega al menos un producto al carrito.';
    if (!clienteId) return 'Falta seleccionar el cliente de esta venta.';
    return '';
  }, [carrito.length, clienteId]);

  const cobrar = async () => {
    if (faltante) return;

    setGuardando(true);
    setMensaje('');
    try {
      await VentaService.crearVenta({
        usuarioId: Number(clienteId),
        metodoPago,
        tipoVenta: 'Presencial',
        codigoDescuento: cuponAplicado ? 'DROP10' : null,
        costoEnvio: 0,
        items: carrito.map((item) => ({
          detalleProductoId: item.id,
          cantidad: item.cantidad,
          precioUnitario: Number(item.producto?.prcio_venta),
        })),
      });
      setCarrito([]);
      setClienteId('');
      setBusqueda('');
      setCupon('');
      setCuponAplicado(false);
      setMensaje('Venta registrada. La factura ya está disponible en Facturación.');
      await cargarDatos();
      if (onVentaRegistrada) onVentaRegistrada();
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No se pudo registrar la venta.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="admin-module">
      <header className="module-header">
        <div>
          <h1>Nueva venta</h1>
        </div>
      </header>

      {mensaje && <div className="admin-notice" role="status">{mensaje}</div>}

      <div className="pos-workspace">
        <section className="pos-selection data-card">
          <div className="pos-cliente">
            <label className="full-field">
              Cliente
              <select value={clienteId} onChange={(evento) => setClienteId(evento.target.value)}>
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellido} · {cliente.dni || cliente.correo}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="secondary-button"
              onClick={() => { setCreandoCliente(!creandoCliente); setErrorCliente(''); }}
            >
              {creandoCliente ? 'Cancelar' : '+ Cliente nuevo'}
            </button>
          </div>

          {creandoCliente && (
            <form className="pos-cliente-form" onSubmit={guardarCliente}>
              <p className="pos-cliente-titulo">Registrar cliente sin salir de la venta</p>
              <div className="field-grid">
                <label>Nombres<input required {...campoCliente('nombre')} /></label>
                <label>Apellidos<input {...campoCliente('apellido')} /></label>
                <label>DNI<input inputMode="numeric" {...campoCliente('dni')} /></label>
                <label>Teléfono<input inputMode="tel" {...campoCliente('telefono')} /></label>
                <label className="full-field">
                  Correo
                  <input required type="email" placeholder="cliente@correo.com" {...campoCliente('correo')} />
                </label>
              </div>
              <button className="primary-button" type="submit" disabled={guardandoCliente}>
                {guardandoCliente ? 'Guardando…' : 'Crear y usar en esta venta'}
              </button>
              {errorCliente && <small className="form-feedback pos-error">{errorCliente}</small>}
            </form>
          )}

          <label className="full-field pos-buscador">
            Buscar producto
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Nombre, modelo, marca, color o talla"
              autoComplete="off"
            />
          </label>

          <form className="pos-barcode" onSubmit={(evento) => { evento.preventDefault(); agregarPorCodigo(codigoBarras); }}>
            <label>
              Código de barras o ID de variante
              <input value={codigoBarras} onChange={(evento) => setCodigoBarras(evento.target.value)} autoComplete="off" />
            </label>
            <button type="submit" className="secondary-button">Agregar código</button>
            <button type="button" className="secondary-button" onClick={escaneando ? detenerEscaner : iniciarEscaner}>
              {escaneando ? 'Cerrar cámara' : 'Escanear con cámara'}
            </button>
          </form>
          {escaneando && <video ref={videoRef} className="pos-camera" muted playsInline aria-label="Vista de la cámara para escanear" />}

          <div className="pos-resultados-cabecera">
            <span>
              {cargando
                ? 'Cargando inventario…'
                : `${resultados.length} ${resultados.length === 1 ? 'talla disponible' : 'tallas disponibles'}`}
            </span>
            {busqueda && (
              <button type="button" className="text-button" onClick={() => setBusqueda('')}>
                Limpiar búsqueda
              </button>
            )}
          </div>

          {!cargando && resultados.length === 0 ? (
            <p className="helper-text">
              {variantes.length === 0
                ? 'No hay productos con stock. Revísalo en Inventario.'
                : `Ningún producto coincide con “${busqueda}”.`}
            </p>
          ) : (
            <ul className="pos-resultados">
              {resultados.map((variante) => {
                const yaEnCarrito = enCarrito(variante.id);
                const sinSaldo = yaEnCarrito >= variante.stock;

                return (
                  <li key={variante.id}>
                    {variante.producto?.foto
                      ? <img src={resolverUrlImagen(variante.producto.foto)} alt="" />
                      : <span className="pos-sin-foto">DROP</span>}

                    <span className="pos-resultado-datos">
                      <strong>{variante.producto?.nombre}</strong>
                      <small>Talla {variante.talla} · {variante.marca?.nombre} · {variante.color}</small>
                    </span>

                    <span className="pos-resultado-precio">
                      {soles(variante.producto?.prcio_venta)}
                      <small>{variante.stock - yaEnCarrito} disponibles</small>
                    </span>

                    <button
                      type="button"
                      className="pos-agregar"
                      disabled={sinSaldo}
                      onClick={() => agregar(variante)}
                    >
                      {sinSaldo ? 'Sin stock' : 'Agregar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="sale-summary">
          <header>
            <h2>Carrito</h2>
          </header>

          {carrito.length === 0 ? (
            <div className="empty-cart">El carrito está vacío</div>
          ) : (
            <ul>
              {carrito.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.producto?.nombre}</strong>
                    <small>Talla {item.talla} · {item.marca?.nombre}</small>
                  </span>

                  <div className="quantity-control">
                    <button onClick={() => cambiarCantidad(item.id, -1)}>−</button>
                    <b>{item.cantidad}</b>
                    <button onClick={() => cambiarCantidad(item.id, 1)} disabled={item.cantidad >= item.stock}>+</button>
                  </div>

                  <strong>{soles(item.producto?.prcio_venta * item.cantidad)}</strong>

                  <button className="remove-line" onClick={() => quitar(item.id)}>×</button>
                </li>
              ))}
            </ul>
          )}

          <dl className="sale-totals">
            <div><dt>Subtotal</dt><dd>{soles(subtotal)}</dd></div>
            {descuento > 0 && <div><dt>Descuento</dt><dd>− {soles(descuento)}</dd></div>}
            <div><dt>IGV (18%)</dt><dd>{soles(igv)}</dd></div>
            <div className="grand-total"><dt>Total</dt><dd>{soles(total)}</dd></div>
          </dl>

          <label>
            Cupón
            <span className="pos-coupon">
              <input value={cupon} onChange={(evento) => setCupon(evento.target.value)} placeholder="DROP10" />
              <button type="button" onClick={() => setCuponAplicado(cupon.trim().toUpperCase() === 'DROP10')}>Aplicar</button>
            </span>
          </label>

          <label>
            Método de pago
            <select value={metodoPago} onChange={(evento) => setMetodoPago(evento.target.value)}>
              <option>EFECTIVO</option>
              <option>TARJETA</option>
              <option>YAPE/PLIN</option>
            </select>
          </label>

          {/* Nunca dejamos un botón gris sin explicar qué falta. */}
          {faltante && <p className="pos-faltante" role="status">{faltante}</p>}

          <button
            className="primary-button full-button"
            disabled={guardando || Boolean(faltante)}
            onClick={cobrar}
          >
            {guardando ? 'Registrando…' : 'Finalizar venta'}
          </button>
        </aside>
      </div>
    </section>
  );
}

export default PuntoDeVenta;
