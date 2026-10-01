/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Dto.DetalleVentaRequestDto;
import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Exception.StockInsuficienteException;
// IMPORTANTE: Usamos tus nombres de entidad exactos
import com.dropStore.DropStore.Modelo.detalle_producto; 
import com.dropStore.DropStore.Modelo.DetalleVenta;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.Repositorio.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class VentaServiceImpl implements IVentaService {

    // Inyectamos todos los repositorios que necesitamos
    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @Autowired
    private DetalleProductoRepository detalleProductoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository; // Este ya lo tenías

    @Override
    @Transactional // ¡MUY IMPORTANTE! Si algo falla, revierte todo.
    public Venta registrarVenta(VentaRequestDto ventaDto) {
        if (ventaDto.getItems() == null || ventaDto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La venta debe incluir al menos un producto.");
        }
        
        // 1. Buscar al Usuario
        Usuario usuario = usuarioRepository.findById(ventaDto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + ventaDto.getUsuarioId()));

        // 2. Crear y Guardar la Venta principal
        Venta nuevaVenta = new Venta();
        nuevaVenta.setUsuario(usuario);
        nuevaVenta.setFecha(new Date()); // Pone la fecha y hora actual
        nuevaVenta.setMetodo_pago(ventaDto.getMetodoPago());
        nuevaVenta.setTipo_venta("Online"); // Tipo de venta fijo
        
        // Guardamos los nuevos campos que añadimos a la entidad Venta
        nuevaVenta.setSubtotal(0.0);
        nuevaVenta.setCostoEnvio(Math.max(0, ventaDto.getCostoEnvio()));
        nuevaVenta.setIgv(0.0);
        nuevaVenta.setTotal(0.0);
        
        // (Opcional: podrías guardar los datos del DTO cliente 
        //  si añades campos a tu Entidad Venta, ej: direccion_envio, nombre_cliente)
        
        Venta ventaGuardada = ventaRepository.save(nuevaVenta);
        
        // 3. Recorrer los items del carrito y guardarlos (y descontar stock)
        double subtotalCalculado = 0.0;
        for (DetalleVentaRequestDto itemDto : ventaDto.getItems()) {
            if (itemDto.getCantidad() <= 0) {
                throw new IllegalArgumentException("La cantidad de cada producto debe ser mayor a cero.");
            }
            
            // 3a. Buscar el DetalleProducto (la variante)
            // USAMOS TU ENTIDAD: detalle_producto (minúscula)
            detalle_producto detalleProd = detalleProductoRepository.findById(itemDto.getDetalleProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto (variante) no encontrado con ID: " + itemDto.getDetalleProductoId()));

            // 3b. ¡Verificar el Stock!
            if (detalleProd.getStock() < itemDto.getCantidad()) {
                // Si no hay stock, lanzamos la excepción.
                // @Transactional se encargará de revertir la Venta que guardamos.
                throw new StockInsuficienteException("Stock insuficiente para el producto: " + detalleProd.getProducto().getNombre() + " (Talla: " + detalleProd.getTalla() + "). Stock actual: " + detalleProd.getStock());
            }

            // 3c. Descontar el Stock
            int nuevoStock = detalleProd.getStock() - itemDto.getCantidad();
            detalleProd.setStock(nuevoStock);
            detalleProductoRepository.save(detalleProd); // Guardamos el producto con el nuevo stock

            // 3d. Crear y Guardar el DetalleVenta
            DetalleVenta detalleVenta = new DetalleVenta();
            detalleVenta.setVenta_id(ventaGuardada); // Lo asociamos a la venta principal
            
            // USAMOS TU ENTIDAD Y SETTER: setDetalle_producto()
            detalleVenta.setDetalle_producto(detalleProd); // ¡La relación corregida!
            
            detalleVenta.setCantidad(itemDto.getCantidad());
            double precioUnitario = detalleProd.getProducto().getPrcio_venta();
            detalleVenta.setCosto(precioUnitario);
            subtotalCalculado += precioUnitario * itemDto.getCantidad();
            // El campo 'envio' en detalle_venta no lo usamos, 
            // ya que el costo de envío está en la Venta general.
            
            detalleVentaRepository.save(detalleVenta);
        }

        double igvCalculado = subtotalCalculado * 0.18;
        ventaGuardada.setSubtotal(subtotalCalculado);
        ventaGuardada.setIgv(igvCalculado);
        ventaGuardada.setTotal(subtotalCalculado + igvCalculado + ventaGuardada.getCostoEnvio());
        ventaRepository.save(ventaGuardada);
        
        // 4. Devolver la venta guardada
        return ventaGuardada;
    }

    @Override
    public List<Venta> listarVentasPorUsuario(Long usuarioId) {
 return ventaRepository.findByUsuario_IdOrderByFechaDesc(usuarioId);    }

    @Override
    public List<DetalleVenta> listarDetalles(Long ventaId) {
        if (!ventaRepository.existsById(ventaId)) {
            throw new RuntimeException("Venta no encontrada con ID: " + ventaId);
        }
        return detalleVentaRepository.findByVentaId(ventaId);
    }

    @Override
    @Transactional
    public void eliminarVenta(Long ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con ID: " + ventaId));
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaId(ventaId);
        for (DetalleVenta detalle : detalles) {
            detalle_producto variante = detalle.getDetalle_producto();
            variante.setStock(variante.getStock() + detalle.getCantidad());
            detalleProductoRepository.save(variante);
        }
        detalleVentaRepository.deleteAll(detalles);
        ventaRepository.delete(venta);
    }
}
