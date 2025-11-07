import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // 👈 Importar useParams y useNavigate
import InventoryService from '../services/inventory.service'; 

// Estilos básicos (puedes usar tu CSS)
const style = {
    // ... (Mantén tus estilos existentes)
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

const API_URL = 'http://localhost:8081/api'; // Asegúrate de que API_URL está definido
import axios from 'axios'; // Asegúrate de que axios está importado

function Catalogo() {
    // Lee el parámetro 'genero' de la URL (e.g., 'Mujer')
    const { genero } = useParams(); 
    const navigate = useNavigate(); // Para cambiar la URL al filtrar
    
    // Estados para el catálogo
    const [productos, setProductos] = useState([]);
    const [marcas, setMarcas] = useState([]); // Para la sección de Marcas
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    
    // Estados de filtrado
    const [filtroGenero, setFiltroGenero] = useState(genero || ''); // Usa el valor de la URL
    const [filtroMarca, setFiltroMarca] = useState('');

    // Función para cargar productos, ahora acepta género y marca
 const cargarProductos = useCallback(async (gen, marca) => {
        setCargando(true);
        setError('');
        
        // 1. CONSTRUIR LOS PARÁMETROS DE CONSULTA
        const params = new URLSearchParams();
        if (gen) {
            params.append('genero', gen); // Agrega genero=Mujer o genero=Hombre
        }
        if (marca) {
            params.append('marca', marca); // Agrega marca=Nike o marca=Adidas
        }

        // 2. CONSTRUIR LA URL FINAL: /api/productos?genero=...&marca=...
        const url = `${API_URL}/productos?${params.toString()}`;

        try {
          const response = await axios.get(url, { withCredentials: true }); 
            
            // 🚨 CAMBIO CLAVE: Aplicamos la agrupación ANTES de guardar en el estado
            const productosAgrupados = agruparPorProducto(response.data);
            setProductos(productosAgrupados); 
            
        } catch (err) {
            console.error("Error al cargar productos:", err);
            setError('Error al cargar el catálogo. Verifica el backend y el servicio.');
            setProductos([]);
        } finally {
            setCargando(false);
        }
    }, []);

    // Función para cargar Marcas disponibles
    const cargarMarcas = async () => {
        try {
            const res = await InventoryService.getAllMarcas(); // Usa tu servicio existente
            setMarcas(res.data);
        } catch (error) {
            console.error("Error al cargar marcas:", error);
        }
    };
    
    // Efecto que carga datos al inicio y cuando cambia el filtro de género/marca
    useEffect(() => {
        // Cargar productos con los filtros actuales
        cargarProductos(filtroGenero, filtroMarca);
        // Cargar las marcas disponibles una sola vez
        if (marcas.length === 0) {
            cargarMarcas();
        }
    }, [filtroGenero, filtroMarca, cargarProductos, marcas.length]); 

    // Efecto para sincronizar el filtro de la URL (si el usuario usa el botón back)
    useEffect(() => {
        setFiltroGenero(genero || '');
    }, [genero]);
    
    // Maneja el clic en los botones de Género (actualiza estado y URL)
    const handleGeneroClick = (gen) => {
        const newGen = filtroGenero === gen ? '' : gen; // Desactivar si ya está activo
        setFiltroGenero(newGen);
        
        // Actualiza la URL para reflejar el filtro (útil para compartir o botón back)
        if (newGen) {
            navigate(`/catalogo/${newGen}`);
        } else {
            navigate(`/catalogo`);
        }
    };
    // Asegúrate que esta función está DENTRO de function Catalogo() { ... }
const agruparPorProducto = (detalles) => {
    if (!detalles || detalles.length === 0) return [];
    
    const productosAgrupados = {};

    detalles.forEach(detalle => {
        // Asumimos que el backend garantiza que detalle.producto existe
        const productoId = detalle.producto.id; 
        
        if (!productosAgrupados[productoId]) {
            productosAgrupados[productoId] = {
                // 🚨 CORRECCIÓN CLAVE: Copia todas las propiedades del Producto Maestro
                ...detalle.producto, 
                // Añadimos la marca principal y la lista de variantes
                marcaPrincipal: detalle.marca?.nombre || 'N/A', 
                variantes: []
            };
        }
        
        // Añadimos el detalle (la talla/stock específica) como una variante
        productosAgrupados[productoId].variantes.push(detalle);
    });

    return Object.values(productosAgrupados);
};
    
    // Maneja el clic en los botones/filtros de Marca
    const handleMarcaClick = (marcaNombre) => {
        // Alternar el filtro de marca
        setFiltroMarca(filtroMarca === marcaNombre ? '' : marcaNombre);
        // NOTA: No cambiamos la URL aquí, solo el estado interno.
    };

    const getImageUrl = (path) => {
        // Mantenemos la lógica de la URL de la imagen
        if (path && path.startsWith('/uploads')) {
            return `http://localhost:8081${path}`; // Ajusta la URL base si es diferente
        }
        return path; 
    };

    return (
        <div style={style.container}>
            <header style={style.header}>
                <h1>👟 Catálogo {filtroGenero ? `| ${filtroGenero}` : ''}</h1>
            </header>
            
            <div style={{ display: 'flex', minHeight: '80vh' }}>
                
                {/* ========== BARRA LATERAL DE FILTROS (IZQUIERDA) ========== */}
                <div style={style.sidebar}>
                    
                    {/* Filtros de Género (si no viene de la URL) */}
                    <h3>Filtrar por Género</h3>
                    <button 
                        style={{...style.button, backgroundColor: filtroGenero === 'Mujer' ? '#e84393' : 'white', color: filtroGenero === 'Mujer' ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '5px'}} 
                        onClick={() => handleGeneroClick('Mujer')}>
                        Mujer
                    </button>
                    <button 
                        style={{...style.button, backgroundColor: filtroGenero === 'Hombre' ? '#2ecc71' : 'white', color: filtroGenero === 'Hombre' ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '15px'}} 
                        onClick={() => handleGeneroClick('Hombre')}>
                        Hombre
                    </button>
                    <button 
                        style={{...style.button, backgroundColor: filtroGenero === 'Unisex' ? '#3498db' : 'white', color: filtroGenero === 'Unisex' ? 'white' : 'black', display: 'block', width: '100%', marginBottom: '15px'}} 
                        onClick={() => handleGeneroClick('Unisex')}>
                        Unisex
                    </button>
                    
                    {/* Filtros de Marca */}
                    <h3>Filtrar por Marca</h3>
                    {marcas.map(marca => (
                        <button 
                            key={marca.id}
                            style={{
                                ...style.button, 
                                backgroundColor: filtroMarca === marca.nombre ? '#f39c12' : 'white', 
                                color: filtroMarca === marca.nombre ? 'white' : 'black',
                                display: 'block', 
                                width: '100%', 
                                marginBottom: '5px'
                            }} 
                            onClick={() => handleMarcaClick(marca.nombre)}>
                            {marca.nombre}
                        </button>
                    ))}
                    
                    {/* Botón para resetear todos los filtros */}
                    {(filtroGenero || filtroMarca) && (
                         <button 
                            style={{...style.button, backgroundColor: '#c0392b', color: 'white', display: 'block', width: '100%', marginTop: '20px'}} 
                            onClick={() => {setFiltroGenero(''); setFiltroMarca(''); navigate('/catalogo')}}>
                            Limpiar Filtros
                        </button>
                    )}
                </div>
                
            {/* ========== CONTENIDO PRINCIPAL (PRODUCTOS) ========== */}
                <div style={style.mainContent}>
                    {cargando && <p style={{ textAlign: 'center' }}>Cargando productos...</p>}
                    {error && <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>}
                    
                    {!cargando && productos.length === 0 && !error && (
                        <p style={{ textAlign: 'center' }}>No hay productos registrados que coincidan con los filtros.</p>
                    )}

                    {/* 🚨 CAMBIO CLAVE: Iteramos sobre los PRODUCTOS MAESTROS (Agrupados) */}
                <div style={style.productsGrid}>
                        {productos.map(productoMaestro => ( 
                            // productoMaestro ya contiene el array 'variantes'
                            <div key={productoMaestro.id} style={style.productCard}>
                                
                                {/* 1. IMAGEN: Usa la foto del producto maestro */}
                                <img 
                                    src={getImageUrl(productoMaestro.foto)} 
                                    alt={productoMaestro.nombre || 'Producto sin Nombre'} 
                                    style={style.productImage} 
                                    onError={(e) => { e.target.onerror = null; e.target.src=""; }}
                                />
                                
                                {/* 2. INFORMACIÓN PRINCIPAL */}
                                <h3>{productoMaestro.nombre || 'N/A'}</h3>
                                <p>Modelo: {productoMaestro.modelo || 'N/A'}</p>
                                <p>Marca: {productoMaestro.variantes[0]?.marca?.nombre || 'N/A'}</p> 
                                
                                {/* 3. MUESTRA DINÁMICA DE VARIANTES (TALLAS Y STOCK) */}
                                <div style={{ minHeight: '40px', margin: '5px 0' }}>
                                    <p style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Tallas ({productoMaestro.variantes.length}):</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
                                        {productoMaestro.variantes.map(variante => (
                                            <span 
                                                key={variante.id} 
                                                style={{ padding: '2px 5px', border: '1px solid #2c3e50', borderRadius: '3px', fontSize: '0.8em', backgroundColor: '#ecf0f1' }}>
                                                {variante.talla} ({variante.stock})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* 4. PRECIO: Usa el precio de venta del maestro */}
                                <p style={style.price}>S/ {productoMaestro.prcio_venta ? productoMaestro.prcio_venta.toFixed(2) : '0.00'}</p> 
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Catalogo;