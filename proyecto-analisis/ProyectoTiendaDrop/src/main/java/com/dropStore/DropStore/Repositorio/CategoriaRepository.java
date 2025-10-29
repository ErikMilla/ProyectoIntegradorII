
package com.dropStore.DropStore.Repositorio;
import com.dropStore.DropStore.Modelo.categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface CategoriaRepository extends JpaRepository<categoria, Long>{
    
}
