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
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long>{
    @Query("select d from DetalleVenta d where d.venta_id.id = :ventaId")
    List<DetalleVenta> findByVentaId(@Param("ventaId") Long ventaId);

    @Query("select (count(d) > 0) from DetalleVenta d where d.detalle_producto.id = :detalleProductoId")
    boolean existsByDetalleProductoId(@Param("detalleProductoId") Long detalleProductoId);

    @Query("select (count(d) > 0) from DetalleVenta d " +
            "where d.detalle_producto.producto.id = :productoId and d.venta_id.usuario.id = :usuarioId")
    boolean existsCompraDeProductoPorUsuario(@Param("productoId") Long productoId,
                                              @Param("usuarioId") Long usuarioId);

    @Query("select coalesce(sum((d.costo - coalesce(d.detalle_producto.producto.precio_compra, 0)) * d.cantidad), 0) " +
            "from DetalleVenta d")
    Double calcularMargenBrutoEstimado();

    @Query("select d.detalle_producto.producto.id, d.detalle_producto.producto.nombre, " +
            "sum(d.cantidad), sum(d.costo * d.cantidad) from DetalleVenta d " +
            "group by d.detalle_producto.producto.id, d.detalle_producto.producto.nombre " +
            "order by sum(d.cantidad) desc")
    List<Object[]> productosMasVendidos(Pageable limite);
}
