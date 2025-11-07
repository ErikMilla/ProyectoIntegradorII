import React, { useState, useEffect } from 'react';
import InventoryService from '../../services/inventory.service';
import axios from 'axios';

// URL base de la API para la subida de archivos
const API_URL = 'http://localhost:8081/api';

function InventarioManagement() {
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // 1. ESTADO DEL PRODUCTO MAESTRO (Solo información genérica)
  const [formData, setFormData] = useState({
    nombre: '',
    modelo: '',
    precioCompra: 0.0,
    precioVenta: 0.0,
    descripcion: '',
    categoriaId: '',
  });

  // 2. ESTADO DINÁMICO DE VARIANTES (Talla, Stock, Color, Género, Marca)
  const [variantes, setVariantes] = useState([{
    talla: 0.0,
    stock: 0,
    color: '',
    genero: 'Unisex',
    marcaId: '',
  }]);

  // ** FUNCIÓN PARA LIMPIAR EL FORMULARIO DESPUÉS DEL ÉXITO **
  const resetForm = () => {
    // 1. Resetear Producto Maestro
    setFormData({
      nombre: '',
      modelo: '',
      precioCompra: 0.0,
      precioVenta: 0.0,
      descripcion: '',
      categoriaId: categorias.length > 0 ? categorias[0].id.toString() : '',
    });
    // 2. Resetear Variantes a la inicial (tomando valores por defecto si existen)
    setVariantes([{
      talla: 0.0,
      stock: 0,
      color: '',
      genero: 'Unisex',
      marcaId: marcas.length > 0 ? marcas[0].id.toString() : '',
    }]);
    // 3. Resetear Archivo y Preview
    setFotoFile(null);
    setPreviewUrl('');
    // 4. Limpiar Mensaje
    setMensaje('');
  };


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, marcaRes] = await Promise.all([
        InventoryService.getAllCategorias(),
        InventoryService.getAllMarcas()
      ]);
      setCategorias(catRes.data);
      setMarcas(marcaRes.data);

      // Intentamos establecer el primer valor por defecto si existe
      if (catRes.data.length > 0) {
        setFormData(prev => ({ ...prev, categoriaId: catRes.data[0].id.toString() }));
      }
      // Establecer la marcaId por defecto en el array de variantes
      if (marcaRes.data.length > 0) {
        setVariantes(prev => prev.map(v => ({
          ...v,
          marcaId: marcaRes.data[0].id.toString()
        })));
      }

    } catch (error) {
      setMensaje('Error al cargar categorías o marcas. Asegúrate de que las APIs estén funcionando.');
    }
  };

  // FUNCIÓN PARA MANEJAR CAMBIOS EN EL PRODUCTO MAESTRO
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = e.target.files[0];
      setFotoFile(file);
      setPreviewUrl(file ? URL.createObjectURL(file) : '');
    } else {
        let val = value;
        
        // Manejo numérico para campos del producto maestro (Precio)
        if (type === 'number') {
            if (value === '') {
                val = 0; 
            } else {
                val = parseFloat(value);
            }
        }
        
      setFormData(prev => ({
        ...prev,
        [name]: val,
        ...(name === 'categoriaId' ? { [name]: value } : {}) 
      }));
    }
  };


  // FUNCIÓN PARA MANEJAR CAMBIOS EN EL ARRAY DE VARIANTES
  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;

    // Manejo de valores numéricos (Talla y Stock)
    let val = value;
    if (name === 'talla' || name === 'stock') {
      val = value !== '' ? parseFloat(value) : 0;
    }
    
    // Asegurar que stock es entero
    if (name === 'stock' && !isNaN(val)) {
        val = parseInt(val);
    }
    // Asegurar que color es string (no se toca)
    
    const newVariantes = variantes.map((variante, i) => {
      if (i === index) {
        return {
          ...variante,
          [name]: isNaN(val) ? (name === 'stock' || name === 'talla' ? 0 : value) : val
        };
      }
      return variante;
    });
    setVariantes(newVariantes);
  };

  // FUNCIÓN PARA AÑADIR UNA NUEVA FILA DE VARIANTE
  const handleAddVariant = () => {
    const lastVariant = variantes[variantes.length - 1];
    setVariantes([...variantes, {
      talla: 0.0,
      stock: 0,
      color: lastVariant.color || '',
      genero: lastVariant.genero || 'Unisex',
      marcaId: lastVariant.marcaId || (marcas.length > 0 ? marcas[0].id.toString() : '')
    }]);
  };

  // FUNCIÓN PARA ELIMINAR UNA FILA DE VARIANTE
  const handleRemoveVariant = (index) => {
    if (variantes.length > 1) {
      const newVariantes = variantes.filter((_, i) => i !== index);
      setVariantes(newVariantes);
    } else {
      setMensaje('Un producto debe tener al menos una variante (talla/stock).');
    }
  };

  // FUNCIÓN DE ENVÍO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    // 1. Validación de Producto Maestro
    if (!formData.categoriaId || !formData.nombre || !fotoFile) {
      setMensaje('Faltan campos obligatorios del Producto Básico (Nombre, Categoría, Foto).');
      return;
    }

    // 2. Validación de Variantes
    const variantesValidas = variantes.every(v =>
      v.talla > 0 && v.stock > 0 && v.marcaId !== '' && v.color.trim() !== ''
    );
    if (!variantesValidas) {
      setMensaje('Todas las variantes deben tener Talla > 0, Stock > 0, Color y Marca válidos.');
      return;
    }

    const data = new FormData();

    // 3. DTO de Producto Maestro
    const productoMaestroDto = {
      nombre: formData.nombre,
      modelo: formData.modelo,
      precioCompra: parseFloat(formData.precioCompra),
      precioVenta: parseFloat(formData.precioVenta),
      descripcion: formData.descripcion,
      categoriaId: parseInt(formData.categoriaId),
    };

    // 4. DTO de Variantes
    const variantesDto = variantes.map(v => ({
      genero: v.genero,
      talla: parseFloat(v.talla),
      stock: parseInt(v.stock),
      color: v.color,
      marcaId: parseInt(v.marcaId)
    }));

    // 5. Crear el DTO Final (Producto + Variantes)
    const dataEnvio = {
      producto: productoMaestroDto,
      variantes: variantesDto,
    };

    // Adjuntar archivo y JSON
    data.append('file', fotoFile);
    data.append('data', JSON.stringify(dataEnvio));

    try {
      await axios.post(`${API_URL}/productos`, data, {
        withCredentials: true,
      });

      setMensaje('✅ Producto registrado con éxito en el catálogo.');
      resetForm(); // 🚨 LIMPIA EL FORMULARIO
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al registrar el producto. Revisa la consola y la carpeta /uploads del backend.';
      setMensaje(`Error: ${errorMsg}`);
      console.error("Error completo:", error);
    }
  };
    
  // =================================================================
  // JSX (Cuerpo del formulario)
  // =================================================================
  return (
    <div className="gestion-container">
      <h2>Registro de Nuevo Producto</h2>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>

          {/* ========== SECCIÓN PRODUCTO PRINCIPAL ========== */}
          <h3 style={{ gridColumn: 'span 2', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Información Básica del Producto</h3>

          <input type="text" name="nombre" placeholder="Nombre del Producto" value={formData.nombre} onChange={handleChange} required />
          <input type="text" name="modelo" placeholder="Modelo/SKU" value={formData.modelo} onChange={handleChange} required />

          {/* CARGA DE FOTO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label htmlFor="foto-file" style={{ fontWeight: 'bold' }}>Cargar Foto (JPG/PNG)</label>
            <input type="file" id="foto-file" name="file" onChange={handleChange} accept="image/*" required />
            {previewUrl && (
              <img src={previewUrl} alt="Vista Previa del Producto" style={{ width: '100px', height: '100px', objectFit: 'cover', marginTop: '10px', border: '1px solid #ccc' }} />
            )}
          </div>

          {/* COMBOBOX CATEGORÍA */}
          <div>
            <label htmlFor="categoriaId">Categoría:</label>
            <select id="categoriaId" name="categoriaId" value={formData.categoriaId} onChange={handleChange} required>
              <option value="">-- Seleccionar Categoría --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          {/* PRECIO DE COMPRA (NUMÉRICO ESPECÍFICO) */}
          <div>
            <label htmlFor="precioCompra">💰 Precio de Compra (Costo al Almacén):</label>
            <input type="number" id="precioCompra" name="precioCompra" placeholder="S/ 0.00" value={formData.precioCompra} onChange={handleChange} required min="0" step="0.01" />
          </div>

          {/* PRECIO DE VENTA (NUMÉRICO ESPECÍFICO) */}
          <div>
            <label htmlFor="precioVenta">🏷️ Precio de Venta (PVP):</label>
            <input type="number" id="precioVenta" name="precioVenta" placeholder="S/ 0.00" value={formData.precioVenta} onChange={handleChange} required min="0" step="0.01" />
          </div>

          <textarea name="descripcion" placeholder="Descripción Detallada del Producto" value={formData.descripcion} onChange={handleChange} required style={{ gridColumn: 'span 2' }} />

          {/* ========== SECCIÓN DETALLE / INVENTARIO - DINÁMICO ========== */}
          <h3 style={{ gridColumn: 'span 2', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>
            Registro de Variantes (Talla, Color, Stock)
          </h3>

          {/* INICIO DEL BLOQUE DE VARIANTES */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '15px' }}>

            {variantes.map((variante, index) => (
              <div key={index} style={{ border: '1px dashed #ccc', padding: '15px', borderRadius: '5px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '10px', alignItems: 'center' }}>

                {/* 1. MARCA */}
                <div>
                  <label htmlFor={`marcaId-${index}`}>Marca:</label>
                  <select id={`marcaId-${index}`} name="marcaId" value={variante.marcaId} onChange={(e) => handleVariantChange(index, e)} required>
                    <option value="">-- Seleccionar Marca --</option>
                    {marcas.map(marca => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. GÉNERO */}
                <div>
                  <label htmlFor={`genero-${index}`}>Género:</label>
                  <select id={`genero-${index}`} name="genero" value={variante.genero} onChange={(e) => handleVariantChange(index, e)} required>
                    <option value="Unisex">Unisex</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>

                {/* 3. TALLA */}
                <div>
                  <label htmlFor={`talla-${index}`}>📏 Talla:</label>
                  <input type="number" id={`talla-${index}`} name="talla" placeholder="0.0" value={variante.talla} onChange={(e) => handleVariantChange(index, e)} required min="1" step="0.5" />
                </div>

                {/* 4. STOCK */}
                <div>
                  <label htmlFor={`stock-${index}`}>📦 Stock:</label>
                  <input type="number" id={`stock-${index}`} name="stock" placeholder="0" value={variante.stock} onChange={(e) => handleVariantChange(index, e)} required min="0" />
                </div>

                {/* 5. COLOR */}
                <div>
                  <label htmlFor={`color-${index}`}>🎨 Color:</label>
                  <input type="text" id={`color-${index}`} name="color" placeholder="Color" value={variante.color} onChange={(e) => handleVariantChange(index, e)} required />
                </div>

                {/* BOTÓN ELIMINAR */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" onClick={() => handleRemoveVariant(index)} disabled={variantes.length === 1} style={{ background: '#c0392b', color: 'white', border: 'none', padding: '10px' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {/* BOTÓN AÑADIR VARIANTE */}
            <button type="button" onClick={handleAddVariant} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px', marginTop: '10px' }}>
              + Añadir Nueva Talla/Variante
            </button>
          </div>

          <button type="submit" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
            Registrar Producto en Catálogo
          </button>
        </form>

        {mensaje && <p style={{ gridColumn: 'span 2', color: mensaje.includes('éxito') ? 'green' : 'red', marginTop: '10px', textAlign: 'center' }}>{mensaje}</p>}
      </div>
    </div>
  );
}

export default InventarioManagement;