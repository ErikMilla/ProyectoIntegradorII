
package com.dropStore.DropStore.Repositorio;
import com.dropStore.DropStore.Modelo.detalle_producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleProductoRepository extends JpaRepository<detalle_producto, Long> {
    
}
