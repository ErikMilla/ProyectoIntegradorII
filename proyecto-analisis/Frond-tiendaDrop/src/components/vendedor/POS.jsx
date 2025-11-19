import React, { useState, useEffect } from 'react';
import InventoryService from '../../services/inventory.service';
import VentaService from '../../services/venta.service';
import AuthService from '../../services/auth.service';
import { agruparPorProducto } from '../../utils/productGrouping';

function POS() {
    // --- ESTADOS DE DATOS ---
    const [productosMaestros, setProductosMaestros] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    
    // --- ESTADOS DE SELECCIÓN ---
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
    
    // --- ESTADOS DE LA VENTA ACTUAL ---
    const [carrito, setCarrito] = useState([]);
    const [datosCliente, setDatosCliente] = useState({ dni: '', nombre: '', direccion: '' });
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [mensaje, setMensaje] = useState('');
    const [procesando, setProcesando] = useState(false);

    // 1. Cargar inventario al inicio
    useEffect(() => {
        cargarInventario();
    }, []);

    const cargarInventario = async () => {
        try {
            const res = await InventoryService.getAllProductos();
            // Agrupamos para mostrar productos únicos en la búsqueda
            const agrupados = agruparPorProducto(res.data);
            setProductosMaestros(agrupados);
        } catch (error) {
            console.error("Error cargando inventario:", error);
        }
    };

    // 2. Buscador en tiempo real
    useEffect(() => {
        if (busqueda.trim() === '') {
            setResultadosBusqueda([]);
            return;
        }
        const termino = busqueda.toLowerCase();
        const filtrados = productosMaestros.filter(p => 
            p.nombre.toLowerCase().includes(termino) || 
            p.modelo.toLowerCase().includes(termino)
        );
        setResultadosBusqueda(filtrados);
    }, [busqueda, productosMaestros]);

    // 3. Seleccionar un producto de la lista
    const seleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setBusqueda(''); // Limpiar búsqueda
        setResultadosBusqueda([]); // Ocultar lista
        setVarianteSeleccionada(null); // Resetear talla anterior
    };

    // 4. Agregar item al carrito local
    const agregarAlCarrito = () => {
        if (!productoSeleccionado || !varianteSeleccionada) return;

        const itemExistente = carrito.find(item => item.varianteId === varianteSeleccionada.id);

        if (itemExistente) {
            // Si ya existe, aumentamos cantidad (validando stock)
            if (itemExistente.cantidad + 1 > varianteSeleccionada.stock) {
                alert("No hay suficiente stock disponible.");
                return;
            }
            const nuevoCarrito = carrito.map(item => 
                item.varianteId === varianteSeleccionada.id 
                ? { ...item, cantidad: item.cantidad + 1 }
                : item
            );
            setCarrito(nuevoCarrito);
        } else {
            // Nuevo item
            const nuevoItem = {
                varianteId: varianteSeleccionada.id,
                productoId: productoSeleccionado.id,
                nombre: productoSeleccionado.nombre,
                modelo: productoSeleccionado.modelo,
                talla: varianteSeleccionada.talla,
                precioUnitario: productoSeleccionado.prcio_venta,
                cantidad: 1,
                maxStock: varianteSeleccionada.stock
            };
            setCarrito([...carrito, nuevoItem]);
        }
        // Limpiar selección para siguiente producto
        setProductoSeleccionado(null);
        setVarianteSeleccionada(null);
    };

    // 5. Eliminar del carrito
    const eliminarDelCarrito = (varianteId) => {
        setCarrito(carrito.filter(item => item.varianteId !== varianteId));
    };

    // 6. Cálculos de Totales
    const subtotal = carrito.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // 7. PROCESAR VENTA (Enviar a Backend)
    const procesarVenta = async () => {
        if (carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        if (!datosCliente.dni || !datosCliente.nombre) {
            alert("Por favor ingresa los datos del cliente.");
            return;
        }

        setProcesando(true);
        setMensaje('');

        const currentUser = AuthService.getCurrentUser();

        // Construir objeto DTO para el backend
        const ventaDto = {
            usuarioId: currentUser.id, // ID del vendedor que hace la venta
            metodoPago: metodoPago,
            subtotal: subtotal,
            costoEnvio: 0, // Venta en tienda física
            igv: igv,
            total: total,
            cliente: { // Datos informativos del cliente
                nombre: datosCliente.nombre,
                email: datosCliente.dni, // Usamos DNI temporalmente en email si no hay campo específico
                direccion: datosCliente.direccion,
                telefono: ""
            },
            items: carrito.map(item => ({
                detalleProductoId: item.varianteId,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            }))
        };

        try {
            await VentaService.crearVenta(ventaDto);
            setMensaje('✅ Venta registrada exitosamente!');
            // Limpiar todo
            setCarrito([]);
            setDatosCliente({ dni: '', nombre: '', direccion: '' });
            setProductoSeleccionado(null);
            cargarInventario(); // Recargar stock actualizado
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || "Error al procesar la venta.";
            setMensaje('❌ ' + errorMsg);
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="pos-container" style={{ display: 'flex', gap: '20px', height: '100%', flexWrap: 'wrap' }}>
            
            {/* --- COLUMNA IZQUIERDA: BUSCADOR Y SELECCIÓN --- */}
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3>🔎 Buscar Producto</h3>
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <input 
                        type="text" 
                        placeholder="Escribe el nombre o modelo..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    {/* Lista desplegable de resultados */}
                    {resultadosBusqueda.length > 0 && (
                        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', listStyle: 'none', margin: 0, padding: 0, zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                            {resultadosBusqueda.map(prod => (
                                <li 
                                    key={prod.id} 
                                    onClick={() => seleccionarProducto(prod)}
                                    style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <img src={`http://localhost:8081${prod.foto}`} alt="min" style={{width:'40px', height:'40px', objectFit:'cover'}} />
                                    <div>
                                        <strong>{prod.nombre}</strong> <br/>
                                        <small>{prod.modelo}</small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Panel de Selección */}
                {productoSeleccionado ? (
                    <div style={{ border: '1px solid #3498db', padding: '15px', borderRadius: '5px', backgroundColor: '#f0f8ff' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <img src={`http://localhost:8081${productoSeleccionado.foto}`} alt="Producto" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '5px' }} />
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{productoSeleccionado.nombre}</h2>
                                <p style={{ color: '#555', margin: '5px 0' }}>{productoSeleccionado.modelo}</p>
                                <h3 style={{ color: '#2ecc71', margin: 0 }}>S/ {productoSeleccionado.prcio_venta.toFixed(2)}</h3>
                            </div>
                        </div>

                        <h4 style={{marginTop: '15px'}}>Selecciona Talla (Stock):</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                            {productoSeleccionado.variantes.map(v => (
                                <button
                                    key={v.id}
                                    disabled={v.stock === 0}
                                    onClick={() => setVarianteSeleccionada(v)}
                                    style={{
                                        padding: '10px 15px',
                                        borderRadius: '5px',
                                        border: varianteSeleccionada?.id === v.id ? '2px solid #2ecc71' : '1px solid #ccc',
                                        backgroundColor: v.stock === 0 ? '#eee' : (varianteSeleccionada?.id === v.id ? '#e8f5e9' : 'white'),
                                        cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                                        opacity: v.stock === 0 ? 0.5 : 1,
                                        minWidth: '60px'
                                    }}
                                >
                                    <strong>{v.talla}</strong>
                                    <br/>
                                    <small style={{fontSize:'0.8em'}}>Stock: {v.stock}</small>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={agregarAlCarrito}
                            disabled={!varianteSeleccionada}
                            style={{ width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                        >
                            Agregar a la Orden
                        </button>
                        <button onClick={()=>setProductoSeleccionado(null)} style={{marginTop:'10px', background:'none', border:'none', color:'#e74c3c', cursor:'pointer', textDecoration:'underline', width: '100%'}}>Cancelar selección</button>
                    </div>
                ) : (
                    <div style={{textAlign:'center', color:'#999', marginTop:'50px'}}>
                        <p>Selecciona un producto para ver detalles.</p>
                    </div>
                )}
            </div>

            {/* --- COLUMNA DERECHA: RESUMEN Y PAGO --- */}
            <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. Resumen de Orden */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', flex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <h3>🧾 Orden de Venta</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                                <tr>
                                    <th style={{textAlign:'left', padding:'8px'}}>Prod.</th>
                                    <th style={{padding:'8px'}}>Cant.</th>
                                    <th style={{textAlign:'right', padding:'8px'}}>Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{padding:'8px'}}>
                                            {item.nombre} <br/>
                                            <small style={{color:'#666'}}>Talla: {item.talla}</small>
                                        </td>
                                        <td style={{textAlign:'center'}}>{item.cantidad}</td>
                                        <td style={{textAlign:'right'}}>S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</td>
                                        <td style={{textAlign:'center'}}>
                                            <button onClick={()=>eliminarDelCarrito(item.varianteId)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>✕</button>
                                        </td>
                                    </tr>
                                ))}
                                {carrito.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#999'}}>Orden vacía</td></tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Totales */}
                    <div style={{ borderTop: '2px solid #eee', paddingTop: '10px' }}>
                        <div style={{display:'flex', justifyContent:'space-between'}}><span>Subtotal:</span> <span>S/ {subtotal.toFixed(2)}</span></div>
                        <div style={{display:'flex', justifyContent:'space-between'}}><span>IGV (18%):</span> <span>S/ {igv.toFixed(2)}</span></div>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'1.4rem', fontWeight:'bold', marginTop:'10px', color:'#2c3e50'}}>
                            <span>Total:</span> <span>S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Datos del Cliente y Pago */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <h4>👤 Datos del Cliente</h4>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
                        <input type="text" placeholder="DNI / RUC" value={datosCliente.dni} onChange={e => setDatosCliente({...datosCliente, dni: e.target.value})} style={{padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}} />
                        <input type="text" placeholder="Nombre Cliente" value={datosCliente.nombre} onChange={e => setDatosCliente({...datosCliente, nombre: e.target.value})} style={{padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}} />
                    </div>

                    <h4>💳 Método de Pago</h4>
                    <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'20px', borderRadius:'4px', border:'1px solid #ddd'}}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                        <option value="Yape">Yape</option>
                        <option value="Plin">Plin</option>
                    </select>

                    <button 
                        onClick={procesarVenta} 
                        disabled={procesando || carrito.length === 0}
                        style={{ width: '100%', padding: '15px', backgroundColor: procesando ? '#95a5a6' : '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: 'pointer', fontWeight:'bold' }}
                    >
                        {procesando ? 'Procesando...' : 'COBRAR Y EMITIR BOLETA'}
                    </button>
                    {mensaje && <div style={{marginTop:'10px', textAlign:'center', fontWeight:'bold', color: mensaje.includes('✅') ? 'green' : 'red'}}>{mensaje}</div>}
                </div>

            </div>
        </div>
    );
}

export default POS;