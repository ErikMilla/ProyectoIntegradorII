package com.dropStore.DropStore.Repositorio;

import com.dropStore.DropStore.Modelo.Resena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {

    /** Reseñas de un producto, la más reciente primero. */
    List<Resena> findByProducto_IdOrderByFechaDesc(Long productoId);

    boolean existsByProducto_IdAndUsuario_Id(Long productoId, Long usuarioId);
}
