/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.dropStore.DropStore.Repositorio;

import com.dropStore.DropStore.Modelo.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long>{
    @Query("select d from DetalleVenta d where d.venta_id.id = :ventaId")
    List<DetalleVenta> findByVentaId(@Param("ventaId") Long ventaId);
}
