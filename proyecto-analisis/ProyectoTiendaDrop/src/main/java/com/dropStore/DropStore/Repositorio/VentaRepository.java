/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.Repositorio;

import com.dropStore.DropStore.Modelo.Venta;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Date;

public interface VentaRepository  extends JpaRepository<Venta, Long> {
     List<Venta> findByUsuario_IdOrderByFechaDesc(Long usuarioId);
     List<Venta> findAllByOrderByFechaDesc();
     @Query("select v from Venta v left join v.usuario u where " +
             "(:q is null or str(v.id) like concat('%', :q, '%') or " +
             "lower(concat(coalesce(u.nombre, ''), ' ', coalesce(u.apellido, ''), ' ', coalesce(u.correo, ''))) like lower(concat('%', :q, '%'))) and " +
             "(:desde is null or v.fecha >= :desde) and (:hasta is null or v.fecha <= :hasta) order by v.fecha desc")
     Page<Venta> buscar(@Param("q") String q, @Param("desde") Date desde,
                        @Param("hasta") Date hasta, Pageable pageable);
     @Query("select count(v) from Venta v where lower(v.tipo_venta) = lower(:tipoVenta)")
     long contarPorCanal(@Param("tipoVenta") String tipoVenta);

     @Query("select coalesce(sum(v.total), 0) from Venta v")
     Double sumarIngresos();

     @Query("select coalesce(sum(v.descuento), 0) from Venta v")
     Double sumarDescuentos();
}
