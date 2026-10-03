package com.dropStore.DropStore.Repositorio;

import com.dropStore.DropStore.Modelo.detalle_producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface DetalleProductoRepository extends JpaRepository<detalle_producto, Long> {

    List<detalle_producto> findByProductoId(Long productoId);

    List<detalle_producto> findByGenero(String genero);

    List<detalle_producto> findByMarca_nombre(String nombre);

    List<detalle_producto> findByGeneroAndMarca_nombre(String genero, String nombre);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from detalle_producto d where d.id = :id")
    Optional<detalle_producto> findByIdForUpdate(@Param("id") Long id);
}
