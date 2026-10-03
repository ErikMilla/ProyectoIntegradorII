package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Dto.DetalleRegistroDTO;
import com.dropStore.DropStore.Dto.ProductoConVariantesDTO;
import com.dropStore.DropStore.Dto.ProductoRegistroDTO;
import com.dropStore.DropStore.Modelo.categoria;
import com.dropStore.DropStore.Modelo.detalle_producto;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Repositorio.CategoriaRepository;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.MarcaRepository;
import com.dropStore.DropStore.Repositorio.ProductoRepository;
import com.dropStore.DropStore.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoControllerTest {

    @Mock ProductoRepository productoRepository;
    @Mock DetalleProductoRepository detalleProductoRepository;
    @Mock DetalleVentaRepository detalleVentaRepository;
    @Mock CategoriaRepository categoriaRepository;
    @Mock MarcaRepository marcaRepository;
    @Mock FileStorageService fileStorageService;
    @InjectMocks ProductoController controller;

    @Test
    void unaVarianteInvalidaNoBorraElInventarioExistente() {
        producto existente = new producto();
        existente.setId(3L);
        categoria categoria = new categoria();
        categoria.setId(2L);

        ProductoRegistroDTO productoDto = new ProductoRegistroDTO();
        productoDto.setNombre("Zapatilla");
        productoDto.setModelo("Z-1");
        productoDto.setCategoriaId(2L);

        DetalleRegistroDTO variante = new DetalleRegistroDTO();
        variante.setMarcaId(99L);
        variante.setTalla(40);
        variante.setStock(3);

        ProductoConVariantesDTO solicitud = new ProductoConVariantesDTO();
        solicitud.setProducto(productoDto);
        solicitud.setVariantes(List.of(variante));

        when(productoRepository.findById(3L)).thenReturn(Optional.of(existente));
        when(categoriaRepository.findById(2L)).thenReturn(Optional.of(categoria));
        when(marcaRepository.findById(99L)).thenReturn(Optional.empty());
        when(detalleProductoRepository.findByProductoId(3L)).thenReturn(List.of(new detalle_producto()));

        assertEquals(400, controller.actualizarProducto(3L, solicitud).getStatusCode().value());
        verify(detalleProductoRepository, never()).deleteAll(anyList());
    }

    @Test
    void noEliminaUnProductoQueFormaParteDelHistorialDeVentas() {
        producto existente = new producto();
        existente.setId(3L);
        detalle_producto variante = new detalle_producto();
        variante.setId(8L);

        when(productoRepository.findById(3L)).thenReturn(Optional.of(existente));
        when(detalleProductoRepository.findByProductoId(3L)).thenReturn(List.of(variante));
        when(detalleVentaRepository.existsByDetalleProductoId(8L)).thenReturn(true);

        assertEquals(409, controller.eliminarProducto(3L).getStatusCode().value());
        verify(productoRepository, never()).delete(any());
    }
}
