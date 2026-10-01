package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.DetalleVenta;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.Modelo.detalle_producto;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Dto.DetalleVentaRequestDto;
import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.Repositorio.VentaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class VentaServiceImplTest {

    @Mock VentaRepository ventaRepository;
    @Mock DetalleVentaRepository detalleVentaRepository;
    @Mock DetalleProductoRepository detalleProductoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @InjectMocks VentaServiceImpl ventaService;

    @Test
    void eliminarVentaRestauraElStockAntesDeEliminarLaVenta() {
        Venta venta = new Venta();
        venta.setId(10L);
        detalle_producto variante = new detalle_producto();
        variante.setStock(3);
        DetalleVenta detalle = new DetalleVenta();
        detalle.setCantidad(2);
        detalle.setDetalle_producto(variante);

        when(ventaRepository.findById(10L)).thenReturn(Optional.of(venta));
        when(detalleVentaRepository.findByVentaId(10L)).thenReturn(List.of(detalle));

        ventaService.eliminarVenta(10L);

        assertEquals(5, variante.getStock());
        verify(detalleProductoRepository).save(variante);
        verify(detalleVentaRepository).deleteAll(List.of(detalle));
        verify(ventaRepository).delete(venta);
    }

    @Test
    void registrarVentaCalculaLosTotalesConElPrecioGuardadoEnLaBase() {
        Usuario cliente = new Usuario();
        cliente.setId(1L);
        producto producto = new producto();
        producto.setPrcio_venta(100.0);
        detalle_producto variante = new detalle_producto();
        variante.setId(4L);
        variante.setStock(5);
        variante.setProducto(producto);
        DetalleVentaRequestDto item = new DetalleVentaRequestDto();
        item.setDetalleProductoId(4L);
        item.setCantidad(2);
        item.setPrecioUnitario(1.0);
        VentaRequestDto request = new VentaRequestDto();
        request.setUsuarioId(1L);
        request.setMetodoPago("EFECTIVO");
        request.setSubtotal(1.0);
        request.setIgv(1.0);
        request.setTotal(2.0);
        request.setItems(List.of(item));

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(detalleProductoRepository.findById(4L)).thenReturn(Optional.of(variante));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Venta result = ventaService.registrarVenta(request);

        assertEquals(200.0, result.getSubtotal());
        assertEquals(36.0, result.getIgv());
        assertEquals(236.0, result.getTotal());
    }
}
