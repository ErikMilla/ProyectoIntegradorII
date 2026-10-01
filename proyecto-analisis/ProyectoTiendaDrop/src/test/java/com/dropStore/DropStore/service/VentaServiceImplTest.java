package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.DetalleVenta;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.Modelo.detalle_producto;
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
}
