
package com.dropStore.DropStore.Repositorio;
import com.dropStore.DropStore.Modelo.marca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarcaRepository extends JpaRepository<marca, Long> {
    
}
