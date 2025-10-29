
package com.dropStore.DropStore.Repositorio;
import com.dropStore.DropStore.Modelo.producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<producto, Long> {
    
}
