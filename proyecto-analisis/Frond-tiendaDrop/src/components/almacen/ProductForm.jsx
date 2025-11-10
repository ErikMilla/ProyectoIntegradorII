// En: src/components/almacen/ProductForm.jsx
// (Este es el formulario de EDICIÓN, ahora con Color y Género)

import React, { useState, useEffect } from 'react';
import InventoryService from '../../services/inventory.service';

const initialState = {
    nombre: '', modelo: '', prcio_venta: 0, precio_compra: 0, foto: '',
    descripcion: '', categoriaId: '',
    variantes: []
};

function ProductForm({ productId, onFinish }) {
    
    const [formData, setFormData] = useState(initialState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null); 
    const [listas, setListas] = useState({ categorias: [], marcas: [] });

    // --- CARGA DE DATOS (Producto + Listas) ---
    useEffect(() => {
        
        const cargarDatosProducto = async (id) => {
            try {
                const response = await InventoryService.getProductoConVariantes(id);
                const { producto, variantes } = response.data;
                
                const dataMapeada = {
                    id: producto.id,
                    nombre: producto.nombre,
                    modelo: producto.modelo,
                    foto: producto.foto,
                    descripcion: producto.descripcion,
                    categoriaId: producto.categoriaId || '', 
                    prcio_venta: producto.precioVenta, 
                    precio_compra: producto.precioCompra,
                    
                    // 🟢 CORREGIDO: Ahora cargamos TODOS los campos de la variante
                    variantes: variantes.map(v => ({
                        id: v.id, // ID de la variante
                        talla: v.talla || 0,
                        stock: v.stock || 0,
                        color: v.color || '', // 👈 CAMPO AÑADIDO
                        genero: v.genero || 'Unisex', // 👈 CAMPO AÑADIDO
                        marcaId: v.marcaId || ''
                    })) 
                };
                setFormData(dataMapeada);
            } catch (err) {
                console.error("Error al cargar producto:", err);
                setError("Error al cargar datos del producto.");
            }
        };

        const cargarListas = async () => {
            try {
                const [catRes, marRes] = await Promise.all([
                    InventoryService.getAllCategorias(),
                    InventoryService.getAllMarcas()
                ]);
                setListas({
                    categorias: catRes.data || [],
                    marcas: marRes.data || []
                });
            } catch (err) {
                setError("Error al cargar listas de categorías/marcas.");
            }
        };

        setLoading(true);
        cargarListas().then(() => {
            if (productId) {
                cargarDatosProducto(productId).finally(() => setLoading(false));
            } else {
                // (Este formulario es solo para editar, pero por si acaso)
                setFormData(initialState);
                setLoading(false);
            }
        });

    }, [productId]);

    // --- MANEJADORES DE CAMBIOS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

    // 🟢 CORREGIDO: Un manejador genérico para todos los campos de la variante
    const handleVariantChange = (index, e) => {
        const { name, value } = e.target; // name: 'talla', 'stock', 'color', 'genero', 'marcaId'
        
        const updatedVariants = [...formData.variantes];
        let finalValue = value;

        // Parsear números
        if (name === 'talla' || name === 'stock') {
            finalValue = (value === '' ? 0 : parseFloat(value));
        } else if (name === 'marcaId') {
            finalValue = (value === '' ? '' : parseInt(value, 10));
        }
        
        updatedVariants[index][name] = finalValue;
        setFormData(prev => ({ ...prev, variantes: updatedVariants }));
    };

    // 🟢 CORREGIDO: 'Añadir Talla' ahora incluye los campos nuevos
    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variantes: [...prev.variantes, { 
                id: null, 
                talla: 0, 
                stock: 0, 
                marcaId: '', 
                color: '', // 👈 CAMPO AÑADIDO
                genero: 'Unisex', // 👈 CAMPO AÑADIDO
                esNuevo: true 
            }]
        }));
    };

    const handleRemoveVariant = (index) => {
        const updatedVariants = formData.variantes.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, variantes: updatedVariants }));
    };
    
    // --- MANEJO DE GUARDAR (handleSubmit) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 🟢 CORREGIDO: Validación más completa
        if (!formData.categoriaId) {
            alert("Por favor, selecciona una categoría.");
            return;
        }
        for (const v of formData.variantes) {
            if (!v.marcaId || !v.color || v.color.trim() === '' || !v.genero) {
                alert("Por favor, selecciona marca, color y género para TODAS las tallas.");
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Mapear al DTO del Backend
            const dataParaGuardar = {
                producto: {
                    id: formData.id,
                    nombre: formData.nombre,
                    modelo: formData.modelo,
                    foto: formData.foto, // Usar la foto existente
                    descripcion: formData.descripcion,
                    categoriaId: parseInt(formData.categoriaId, 10), 
                    precioVenta: formData.prcio_venta,
                    precioCompra: formData.precio_compra 
                },
                // 🟢 CORREGIDO: El '...v' ahora pasa TODOS los campos (incluyendo color y genero)
                variantes: formData.variantes.map(v => ({
                    ...v, // Esto pasa (id, talla, stock, color, genero)
                    marcaId: parseInt(v.marcaId, 10) // Aseguramos que marcaId sea número
                }))
            };
            
            console.log("Enviando al backend:", JSON.stringify(dataParaGuardar, null, 2));

            // SOLO ACTUALIZAR (PUT)
            await InventoryService.updateProducto(productId, dataParaGuardar);
            alert("¡Producto actualizado!");
            onFinish(); // Volver a la lista

        } catch (err) {
            const errorMsg = err.response?.data || "Error al guardar el producto.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };


    // --- RENDERIZADO ---
    if (loading) return <div>Cargando formulario...</div>;
    if (error) return <div className="error-message">{error} <button onClick={onFinish}>Volver</button></div>;

    return (
        <div className="product-form-container">
            <h3>Editar Producto (ID: {productId})</h3>
            
            <form onSubmit={handleSubmit}>
                
                {/* --- Campos del Producto Maestro --- */}
                <div>
                    <label>Nombre:</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div>
                    <label>Modelo:</label>
                    <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
                </div>
                 <div>
                    <label>Precio Venta (S/):</label>
                    <input type="number" name="prcio_venta" value={formData.prcio_venta} onChange={handleChange} required />
                </div>
                <div>
                    <label>Categoría:</label>
                    <select name="categoriaId" value={formData.categoriaId} onChange={handleChange} required>
                        <option value="">-- Selecciona una categoría --</option>
                        {listas.categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Imagen (Solo vista previa):</label>
                    {/* No permitimos cambiar la foto en el formulario simple de "Editar" */}
                    {formData.foto && (
                        <img src={`http://localhost:8081${formData.foto}`} alt="Preview" style={{width: '50px', height: '50px'}} />
                    )}
                </div>

                <hr/>
                <h4>Tallas y Stock (Variantes)</h4>
                
                {/* --- Campos de las Variantes --- */}
                {formData.variantes.map((v, index) => (
                    // 🟢 CORREGIDO: Layout más completo para los 5 campos
                    <div key={index} style={{ border: '1px dashed #ccc', padding: '10px', marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        
                        <div>
                            <label>Marca:</label>
                            <select 
                                name="marcaId" 
                                value={v.marcaId} 
                                // 🟢 CORREGIDO: onChange ahora es genérico
                                onChange={(e) => handleVariantChange(index, e)} 
                                required
                            >
                                <option value="">-- Marca --</option>
                                {listas.marcas.map(mar => (
                                    <option key={mar.id} value={mar.id}>
                                        {mar.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 🟢 CAMPO AÑADIDO: GÉNERO */}
                        <div>
                            <label>Género:</label>
                            <select 
                                name="genero" 
                                value={v.genero} 
                                onChange={(e) => handleVariantChange(index, e)} 
                                required
                            >
                                <option value="Unisex">Unisex</option>
                                <option value="Hombre">Hombre</option>
                                <option value="Mujer">Mujer</option>
                            </select>
                        </div>

                        {/* 🟢 CAMPO AÑADIDO: COLOR */}
                        <div>
                            <label>Color:</label>
                            <input 
                                type="text" 
                                name="color" 
                                placeholder="Color" 
                                value={v.color} 
                                onChange={(e) => handleVariantChange(index, e)} 
                                required 
                            />
                        </div>

                        <div>
                            <label>Talla:</label>
                            <input type="number" step="0.5" name="talla" value={v.talla} onChange={(e) => handleVariantChange(index, e)} required />
                        </div>
                        
                        <div>
                            <label>Stock:</label>
                            <input type="number" min="0" name="stock" value={v.stock} onChange={(e) => handleVariantChange(index, e)} required />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="button" onClick={() => handleRemoveVariant(index)} style={{ backgroundColor: '#e74c3c', color: 'white' }}>
                                X
                            </button>
                        </div>
                    </div>
                ))}

                <button type="button" onClick={handleAddVariant}>
                    + Añadir Talla
                </button>
                
                <hr/>
                <button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={onFinish} disabled={loading}>
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default ProductForm;