package com.dropStore.DropStore.Repositorio;

import com.dropStore.DropStore.Modelo.detalle_producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DetalleProductoRepository extends JpaRepository<detalle_producto, Long> {

    List<detalle_producto> findByProductoId(Long productoId);

    List<detalle_producto> findByGenero(String genero);

    List<detalle_producto> findByMarca_nombre(String nombre);

    List<detalle_producto> findByGeneroAndMarca_nombre(String genero, String nombre);
}
