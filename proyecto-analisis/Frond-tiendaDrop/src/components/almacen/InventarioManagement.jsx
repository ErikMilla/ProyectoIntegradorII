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
  
  const [formData, setFormData] = useState({
    nombre: '',
    modelo: '',
    precioCompra: 0.0,
    precioVenta: 0.0,
    descripcion: '',
    categoriaId: '',
    genero: 'Unisex',
    talla: 0.0,
    stock: 0,
    color: '',
    marcaId: '',
  });

  // Cargar Categorías y Marcas al inicio
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
      
      // Intentamos establecer el primer valor por defecto si existe (para evitar errores en selects)
      if (catRes.data.length > 0) {
        setFormData(prev => ({ ...prev, categoriaId: catRes.data[0].id.toString() }));
      }
      if (marcaRes.data.length > 0) {
        setFormData(prev => ({ ...prev, marcaId: marcaRes.data[0].id.toString() }));
      }
      
    } catch (error) {
      setMensaje('Error al cargar categorías o marcas. Asegúrate de que las APIs estén funcionando.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
              const file = e.target.files[0];
              setFotoFile(file);
              setPreviewUrl(file ? URL.createObjectURL(file) : '');
            } else {
                let val = value; // Valor por defecto
        
                // 1. Corregimos NaN: Si es un campo numérico y la cadena está vacía, usamos 0.
                if (type === 'number' || name === 'talla') {
                    if (value === '') {
                        val = 0; // Guardamos 0 para que React no intente renderizar NaN
                    } else {
                        val = parseFloat(value);
                    }
                    
                    // Manejo de NaN por si el usuario escribe texto en el input number (aunque el navegador lo previene)
                    if (isNaN(val)) {
                        val = 0; 
                    }
                }
        
                setFormData(prev => ({ 
                    ...prev, 
                    [name]: val,
                    ...(name === 'categoriaId' || name === 'marcaId' ? { [name]: value } : {})
                }));
            }
          };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (!formData.categoriaId || !formData.marcaId || !fotoFile || formData.stock <= 0) {
        setMensaje('Faltan campos obligatorios (Categoría, Marca, Foto o Stock).');
        return;
    }
    
    const data = new FormData();

    // Preparar DTO para el JSON
    const dataDto = {
        ...formData,
        categoriaId: parseInt(formData.categoriaId),
        marcaId: parseInt(formData.marcaId),
        precioCompra: parseFloat(formData.precioCompra),
        precioVenta: parseFloat(formData.precioVenta),
        talla: parseFloat(formData.talla),
        stock: parseInt(formData.stock),
    };
    
    // Adjuntar archivo y JSON
    data.append('file', fotoFile);
    data.append('data', JSON.stringify(dataDto));

    try {
      // Petición POST a la API de productos
      await axios.post(`${API_URL}/productos`, data, {
          headers: {
              'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
      });

      setMensaje('Producto registrado con éxito en el catálogo.');
      // Opcional: Resetear formulario (simplemente recargar para un reset completo)
      window.location.reload(); 
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al registrar el producto. Revisa la consola y la carpeta /uploads del backend.';
      setMensaje(`Error: ${errorMsg}`);
      console.error("Error completo:", error);
    }
  };

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
          
          {/* ========== SECCIÓN DETALLE / INVENTARIO ========== */}
          <h3 style={{ gridColumn: 'span 2', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>Detalles de Variante e Inventario</h3>
          
          {/* COMBOBOX MARCA */}
          <div>
            <label htmlFor="marcaId">Marca:</label>
            <select id="marcaId" name="marcaId" value={formData.marcaId} onChange={handleChange} required>
              <option value="">-- Seleccionar Marca --</option>
              {marcas.map(marca => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="genero">Género:</label>
            <select id="genero" name="genero" value={formData.genero} onChange={handleChange} required>
              <option value="Unisex">Unisex</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
            </select>
          </div>

          {/* TALLA (NUMÉRICO ESPECÍFICO) */}
          <div>
            <label htmlFor="talla">📏 Talla (Usa punto decimal si aplica, ej: 42.5):</label>
            <input type="number" id="talla" name="talla" placeholder="0.0" value={formData.talla} onChange={handleChange} required min="1" step="0.5" />
          </div>
          
          {/* STOCK INICIAL (NUMÉRICO ESPECÍFICO) */}
          <div>
            <label htmlFor="stock">📦 Stock Inicial:</label>
            <input type="number" id="stock" name="stock" placeholder="0" value={formData.stock} onChange={handleChange} required min="0" />
          </div>
          
          <input type="text" name="color" placeholder="Color Principal (Ej: Negro/Blanco)" value={formData.color} onChange={handleChange} required style={{ gridColumn: 'span 2' }} />
          
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