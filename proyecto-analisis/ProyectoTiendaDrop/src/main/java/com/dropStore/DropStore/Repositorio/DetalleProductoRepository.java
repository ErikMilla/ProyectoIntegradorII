package com.dropStore.DropStore.Repositorio;
import com.dropStore.DropStore.Modelo.detalle_producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DetalleProductoRepository extends JpaRepository<detalle_producto, Long> {
    
    // Búsqueda por Género
    List<detalle_producto> findByGenero(String genero); 

    // Búsqueda por Nombre de Marca (Basado en la relación marca_id)
    List<detalle_producto> findByMarca_nombre(String nombre); 
    
    // Búsqueda combinada: Género Y Marca
    List<detalle_producto> findByGeneroAndMarca_nombre(String genero, String nombre);
}