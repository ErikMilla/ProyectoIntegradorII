import React, { useState, useEffect, useCallback, useContext } from 'react'; // 1. Traemos 'useContext'
import { useParams, useNavigate } from 'react-router-dom';
import InventoryService from '../services/inventory.service';
import axios from 'axios';

// 2. IMPORTAMOS 'CartContext' (NO 'useCart')
import { CartContext } from './CartContext.jsx';

// --- Estilos (Tus estilos de 'style' van aquí) ---
const style = {
    container: { padding: '20px' },
    filters: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' },
    button: { padding: '10px 20px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '5px' },
    productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    productCard: { border: '1px solid #eee', padding: '15px', borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.05)', textAlign: 'center' },
    productImage: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '5px', marginBottom: '10px' },
    price: { fontWeight: 'bold', color: '#e74c3c' },
    sidebar: { width: '200px', padding: '15px', borderRight: '1px solid #eee' },
    mainContent: { flex: 1, padding: '15px' }
};

const API_URL = 'http://localhost:8081/api';
// --- Fin de Estilos ---


function Catalogo() {
    const { genero } = useParams();
    const navigate = useNavigate();

    // --- Estados del Catálogo ---
    const [productos, setProductos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filtroGenero, setFiltroGenero] = useState(genero || '');
    const [filtroMarca, setFiltroMarca] = useState('');

    // 3. USAMOS EL 'useContext' DE REACT (para el error de Vite)
    const { addItem } = useContext(CartContext);

    // 4. AÑADIMOS EL ESTADO PARA EL MODAL (la "ventanita")
    const [modalProducto, setModalProducto] = useState(null);

    // --- Lógica de Carga de Datos (Sin cambios) ---
    const cargarProductos = useCallback(async (gen, marca) => {
        setCargando(true);
        setError('');
        const params = new URLSearchParams();
        if (gen) params.append('genero', gen);
        if (marca) params.append('marca', marca);
        const url = `${API_URL}/productos?${params.toString()}`;

        try {
            const response = await axios.get(url, { withCredentials: true });
            const productosAgrupados = agruparPorProducto(response.data);
            setProductos(productosAgrupados);
        } catch (err) {
            console.error("Error al cargar productos:", err);
            setError('Error al cargar el catálogo.');
            setProductos([]);
        } finally {
            setCargando(false);
        }
    }, []);

    const cargarMarcas = async () => {
        try {
            const res = await InventoryService.getAllMarcas();
            setMarcas(res.data);
        } catch (error) {
            console.error("Error al cargar marcas:", error);
        }
    };

    useEffect(() => {
        cargarProductos(filtroGenero, filtroMarca);
        if (marcas.length === 0) {
            cargarMarcas();
        }
    }, [filtroGenero, filtroMarca, cargarProductos, marcas.length]);

    useEffect(() => {
        setFiltroGenero(genero || '');
    }, [genero]);

    // --- Lógica de Filtros (Sin cambios) ---
    const handleGeneroClick = (gen) => {
        const newGen = filtroGenero === gen ? '' : gen;
        setFiltroGenero(newGen);
        if (newGen) navigate(`/catalogo/${newGen}`);
        else navigate(`/catalogo`);
    };

    const agruparPorProducto = (detalles) => {
        if (!detalles || detalles.length === 0) return [];
        const productosAgrupados = {};
        detalles.forEach(detalle => {
            const productoId = detalle.producto.id;
            if (!productosAgrupados[productoId]) {
                productosAgrupados[productoId] = {
                    ...detalle.producto,
                    marcaPrincipal: detalle.marca?.nombre || 'N/A',
                    variantes: []
                };
            }
            productosAgrupados[productoId].variantes.push(detalle);
        });
        return Object.values(productosAgrupados);
    };

    const handleMarcaClick = (marcaNombre) => {
        setFiltroMarca(filtroMarca === marcaNombre ? '' : marcaNombre);
    };

    const getImageUrl = (path) => {
        if (path && path.startsWith('/uploads')) {
            return `http://localhost:8081${path}`;
        }
        return path;
    };

    // 5. NUEVA FUNCIÓN 'handleFinalAddToCart'
    // Esta es llamada por los botones DENTRO del modal
    const handleFinalAddToCart = (varianteSeleccionada) => {
        if (!modalProducto) return; // Seguridad

        // Llama al 'addItem' del contexto (que espera producto y variante)
        addItem(modalProducto, varianteSeleccionada);

        // Cierra el modal
        setModalProducto(null);

        console.log(`Agregado: ${modalProducto.nombre} - Talla: ${varianteSeleccionada.talla}`);
    };


    return (
        <div style={style.container}>
            <header style={style.header}>
                <h1>👟 Catálogo {filtroGenero ? `| ${filtroGenero}` : ''}</h1>
            </header>

            <div style={{ display: 'flex', minHeight: '80vh' }}>
                {/* ========== BARRA LATERAL DE FILTROS (IZQUIERDA) ========== */}
                <div style={style.sidebar}>
                    {/* ... (Tu JSX de filtros de Género y Marca no cambia) ... */}
                    <h3>Filtrar por Género</h3>
                    <button style={{ ...style.button, backgroundColor: filtroGenero === 'Mujer' ? '#e84393' : 'white', color: filtroGenero === 'Mujer' ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '5px' }} onClick={() => handleGeneroClick('Mujer')}>Mujer</button>
                    <button style={{ ...style.button, backgroundColor: filtroGenero === 'Hombre' ? '#2ecc71' : 'white', color: filtroGenero === 'Hombre' ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '15px' }} onClick={() => handleGeneroClick('Hombre')}>Hombre</button>
                    <button style={{ ...style.button, backgroundColor: filtroGenero === 'Unisex' ? '#3498db' : 'white', color: filtroGenero === 'Unisex' ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '15px' }} onClick={() => handleGeneroClick('Unisex')}>Unisex</button>

                    <h3>Filtrar por Marca</h3>
                    {marcas.map(marca => (
                        <button key={marca.id} style={{ ...style.button, backgroundColor: filtroMarca === marca.nombre ? '#f39c12' : 'white', color: filtroMarca === marca.nombre ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '5px' }} onClick={() => handleMarcaClick(marca.nombre)}>
                            {marca.nombre}
                        </button>
                    ))}
                    {(filtroGenero || filtroMarca) && (
                        <button style={{ ...style.button, backgroundColor: '#c0392b', color: 'white', display: 'block', width: '100%', marginTop: '20px' }} onClick={() => { setFiltroGenero(''); setFiltroMarca(''); navigate('/catalogo') }}>
                            Limpiar Filtros
                        </button>
                    )}
                </div>

                {/* ========== CONTENIDO PRINCIPAL (PRODUCTOS) ========== */}
                <div style={style.mainContent}>
                    {cargando && <p style={{ textAlign: 'center' }}>Cargando productos...</p>}
                    {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}
                    {!cargando && productos.length === 0 && !error && (
                        <p style={{ textAlign: 'center' }}>No hay productos que coincidan.</p>
                    )}

                    <div style={style.productsGrid}>
                        {productos.map(productoMaestro => (
                            <div key={productoMaestro.id} style={style.productCard}>
                                {/* ... (Imagen, Nombre, Modelo, Marca, Tallas... no cambia) ... */}
                                <img src={getImageUrl(productoMaestro.foto)} alt={productoMaestro.nombre || 'Producto'} style={style.productImage} onError={(e) => { e.target.onerror = null; e.target.src = ""; }} />
                                <h3>{productoMaestro.nombre || 'N/A'}</h3>
                                <p>Modelo: {productoMaestro.modelo || 'N/A'}</p>
                                <p>Marca: {productoMaestro.variantes[0]?.marca?.nombre || 'N/A'}</p>
                                <div style={{ minHeight: '40px', margin: '5px 0' }}>
                                    <p style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Tallas ({productoMaestro.variantes.length}):</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
                                        {productoMaestro.variantes.map(variante => (
                                            <span key={variante.id} style={{ padding: '2px 5px', border: '1px solid #2c3e50', borderRadius: '3px', fontSize: '0.8em', backgroundColor: '#ecf0f1' }}>
                                                {variante.talla} ({variante.stock})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p style={style.price}>S/ {productoMaestro.prcio_venta ? productoMaestro.prcio_venta.toFixed(2) : '0.00'}</p>

                                {/* 6. ¡CAMBIO IMPORTANTE EN EL BOTÓN! */}
                                {/* Ya no llama a 'handleAddToCart', ahora abre el modal */}
                                <button
                                    style={{
                                        ...style.button,
                                        backgroundColor: '#2ecc71',
                                        color: 'white',
                                        width: '100%',
                                        SmarginTop: '10px'
                                    }}
                                    // Al hacer clic, guardamos este producto en el estado 'modalProducto'
                                    onClick={() => setModalProducto(productoMaestro)}
                                >
                                    Agregar al Carrito
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 7. EL MODAL (LA VENTANITA) */}
            {/* Esto solo se renderiza si 'modalProducto' NO es 'null' */}
            {modalProducto && (
                <div style={modalStyles.backdrop}> {/* Fondo oscuro */}
                    <div style={modalStyles.modal}> {/* Contenido del modal */}

                        <button style={modalStyles.closeButton} onClick={() => setModalProducto(null)}>
                            X
                        </button>

                        <h2 style={{ marginTop: 0 }}>Selecciona una talla</h2>
                        <p>Estás agregando: <strong>{modalProducto.nombre}</strong></p>

                        <div style={modalStyles.tallasContainer}>
                            {/* Mapeamos las variantes del producto para crear los botones de talla */}
                            {modalProducto.variantes.map(variante => (
                                <button
                                    key={variante.id}
                                    style={modalStyles.tallaButton}
                                    // Al hacer clic, se agrega esa talla y se cierra
                                    onClick={() => handleFinalAddToCart(variante)}
                                >
                                    {variante.talla}
                                    <span style={{ fontSize: '0.8em', display: 'block', color: '#0e0c0cff' }}>
                                        Stock: {variante.stock}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// 8. ESTILOS PARA EL MODAL (Van al final del archivo)
const modalStyles = {
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        position: 'relative',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: '#0f0e0eff',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    tallasContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '20px'
    },
    tallaButton: {
        padding: '10px 15px',
        border: '1px solid #131010ff',
        borderRadius: '5px',
        cursor: 'pointer',
        backgroundColor: '#e46363ff',
        textAlign: 'center'
    }
};

export default Catalogo;