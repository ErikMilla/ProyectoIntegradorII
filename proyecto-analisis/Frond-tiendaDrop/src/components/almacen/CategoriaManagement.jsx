import React, { useState, useEffect } from 'react';
import InventoryService from '../../services/inventory.service';

function CategoriaManagement() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  const fetchCategorias = () => {
    InventoryService.getAllCategorias()
      .then(res => setCategorias(res.data))
      .catch(error => console.error("Error al cargar categorías:", error));
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setMensaje('');
    if (!nombre.trim()) {
      setMensaje('El nombre de la categoría es obligatorio.');
      return;
    }

    InventoryService.createCategoria(nombre)
      .then(() => {
        setMensaje('Categoría registrada con éxito.');
        setNombre('');
        fetchCategorias(); // Recargar la lista
      })
      .catch(error => {
        setMensaje(error.response?.data?.error || 'Error al registrar la categoría.');
      });
  };

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      InventoryService.deleteCategoria(id)
        .then(() => {
          setMensaje('Categoría eliminada con éxito.');
          fetchCategorias();
        })
        .catch(error => {
          setMensaje(error.response?.data?.error || 'Error al eliminar la categoría. Podría estar en uso.');
        });
    }
  };

  // Implementación básica de edición (se puede mejorar con un modal o formulario en línea)
  const handleEdit = (id) => {
      const nuevoNombre = prompt("Ingresa el nuevo nombre para la categoría:");
      if (nuevoNombre && nuevoNombre.trim()) {
          InventoryService.updateCategoria(id, nuevoNombre.trim())
            .then(() => {
                setMensaje('Categoría actualizada con éxito.');
                fetchCategorias();
            })
            .catch(error => {
                setMensaje(error.response?.data?.error || 'Error al actualizar la categoría.');
            });
      }
  };

  return (
    <div className="gestion-container">
      <h2>Gestión de Categorías</h2>

      {/* Formulario de registro */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Registrar Nueva Categoría</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nombre de la Categoría"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ flexGrow: 1, margin: 0 }}
          />
          <button type="submit" style={{ padding: '8px 15px' }}>
            Guardar
          </button>
        </form>
        {mensaje && <p style={{ color: mensaje.includes('éxito') ? 'green' : 'red', marginTop: '10px' }}>{mensaje}</p>}
      </div>

      {/* Tabla de categorías */}
      <h3>Listado de Categorías</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Nombre</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id}>
              <td style={{ border: '1px solid #ddd', padding: '10px' }}>{cat.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '10px' }}>{cat.nombre}</td>
              <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                <button 
                  onClick={() => handleEdit(cat.id)}
                  style={{ marginRight: '5px', backgroundColor: '#FFC107', color: 'black' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  style={{ backgroundColor: '#DC3545', color: 'white' }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {categorias.length === 0 && (
              <tr>
                  <td colSpan="3" style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>No hay categorías registradas.</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CategoriaManagement;