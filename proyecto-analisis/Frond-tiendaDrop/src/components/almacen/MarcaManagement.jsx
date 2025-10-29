// Frond-tiendaDrop/src/components/almacen/MarcaManagement.jsx

import React, { useState, useEffect } from 'react';
import InventoryService from '../../services/inventory.service';

// 1. CORRECCIÓN: La función debe llamarse MarcaManagement
function MarcaManagement() {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  // 2. CORRECCIÓN: La función debe llamar a la API de MARCAS y usar setMarcas
  const fetchMarcas = () => {
    InventoryService.getAllMarcas() // <-- Llama a la API de Marcas
      .then(res => setMarcas(res.data)) // <-- Usa setMarcas
      .catch(error => console.error("Error al cargar marcas:", error));
  };

  useEffect(() => {
    fetchMarcas(); // <-- Llama a la función de fetch correcta
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setMensaje('');
    if (!nombre.trim()) {
      setMensaje('El nombre de la marca es obligatorio.');
      return;
    }

    InventoryService.createMarca(nombre)
      .then(() => {
        setMensaje('Marca registrada con éxito.');
        setNombre('');
        fetchMarcas(); 
      })
      .catch(error => {
        setMensaje(error.response?.data?.error || 'Error al registrar la marca.');
      });
  };

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta marca?')) {
      InventoryService.deleteMarca(id)
        .then(() => {
          setMensaje('Marca eliminada con éxito.');
          fetchMarcas();
        })
        .catch(error => {
          setMensaje(error.response?.data?.error || 'Error al eliminar la marca. Podría estar en uso.');
        });
    }
  };

  const handleEdit = (id) => {
      const nuevoNombre = prompt("Ingresa el nuevo nombre para la marca:");
      if (nuevoNombre && nuevoNombre.trim()) {
          InventoryService.updateMarca(id, nuevoNombre.trim())
            .then(() => {
                setMensaje('Marca actualizada con éxito.');
                fetchMarcas();
            })
            .catch(error => {
                setMensaje(error.response?.data?.error || 'Error al actualizar la marca.');
            });
      }
  };

  return (
    <div className="gestion-container">
      <h2>Gestión de Marcas</h2>

      {/* Formulario de registro */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Registrar Nueva Marca</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nombre de la Marca"
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

      {/* Tabla de Marcas */}
      <h3>Listado de Marcas</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Nombre</th>
            <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((marca) => (
            // 3. CORRECCIÓN: Usar la variable 'marca' para el key y los datos
            <tr key={marca.id}>
              <td style={{ border: '1px solid #ddd', padding: '10px' }}>{marca.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '10px' }}>{marca.nombre}</td>
              <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                <button 
                  onClick={() => handleEdit(marca.id)} // <-- Usar marca.id
                  style={{ marginRight: '5px', backgroundColor: '#FFC107', color: 'black' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(marca.id)} // <-- Usar marca.id
                  style={{ backgroundColor: '#DC3545', color: 'white' }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {/* 4. CORRECCIÓN: Usar la variable 'marcas' para la verificación de lista vacía */}
          {marcas.length === 0 && (
              <tr>
                  <td colSpan="3" style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>No hay marcas registradas.</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// 5. CORRECCIÓN: Exportar el nombre correcto de la función
export default MarcaManagement;