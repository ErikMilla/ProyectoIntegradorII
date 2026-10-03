package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Dto.ClienteDto;
import com.dropStore.DropStore.Dto.DetalleVentaRequestDto;
import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Exception.StockInsuficienteException;
import com.dropStore.DropStore.Modelo.DetalleVenta;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.Modelo.detalle_producto;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.Repositorio.VentaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VentaServiceImplTest {

    @Mock VentaRepository ventaRepository;
    @Mock DetalleVentaRepository detalleVentaRepository;
    @Mock DetalleProductoRepository detalleProductoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock ApplicationEventPublisher eventos;
    @InjectMocks VentaServiceImpl ventaService;

    // ------------------------------------------------------------- utilidades

    private Usuario cliente() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Ana");
        usuario.setApellido("Torres");
        usuario.setTelefono("987000004");
        usuario.setDireccion("Jesús María, Lima");
        return usuario;
    }

    private detalle_producto variante(double precio, int stock) {
        producto modelo = new producto();
        modelo.setNombre("Nike Air Force 1");
        modelo.setPrcio_venta(precio);

        detalle_producto variante = new detalle_producto();
        variante.setId(4L);
        variante.setTalla(40);
        variante.setStock(stock);
        variante.setProducto(modelo);
        return variante;
    }

    private VentaRequestDto pedidoDe(int cantidad) {
        DetalleVentaRequestDto item = new DetalleVentaRequestDto();
        item.setDetalleProductoId(4L);
        item.setCantidad(cantidad);
        item.setPrecioUnitario(1.0); // precio falso: el servicio debe ignorarlo

        VentaRequestDto pedido = new VentaRequestDto();
        pedido.setUsuarioId(1L);
        pedido.setMetodoPago("EFECTIVO");
        pedido.setItems(List.of(item));
        return pedido;
    }

    /** Hace que save() devuelva la misma venta que recibe. */
    private void guardarDevuelveLoRecibido() {
        when(ventaRepository.save(any(Venta.class))).thenAnswer(llamada -> llamada.getArgument(0));
    }

    // ----------------------------------------------------------------- pruebas

    @Test
    void calculaLosTotalesConElPrecioGuardadoEnLaBaseYNoConElQueEnviaElCliente() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        Venta venta = ventaService.registrarVenta(pedidoDe(2));

        assertEquals(200.0, venta.getSubtotal());
        assertEquals(36.0, venta.getIgv());
        assertEquals(236.0, venta.getTotal());
    }

    @Test
    void sumaElCostoDeEnvioAlTotal() {
        VentaRequestDto pedido = pedidoDe(1);
        pedido.setCostoEnvio(17.0);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        Venta venta = ventaService.registrarVenta(pedido);

        assertEquals(17.0, venta.getCostoEnvio());
        assertEquals(135.0, venta.getTotal()); // 100 + 18 de IGV + 17 de envío
    }

    @Test
    void aplicaElCuponDrop10SobreElSubtotalAntesDelIgv() {
        VentaRequestDto pedido = pedidoDe(2);
        pedido.setCodigoDescuento("DROP10");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        Venta venta = ventaService.registrarVenta(pedido);

        assertEquals(20.0, venta.getDescuento());
        assertEquals(32.4, venta.getIgv());
        assertEquals(212.4, venta.getTotal());
    }

    @Test
    void rechazaUnCuponQueNoExiste() {
        VentaRequestDto pedido = pedidoDe(1);
        pedido.setCodigoDescuento("INVENTADO");

        assertThrows(IllegalArgumentException.class, () -> ventaService.registrarVenta(pedido));
    }

    @Test
    void unCostoDeEnvioNegativoNoDescuentaDelTotal() {
        VentaRequestDto pedido = pedidoDe(1);
        pedido.setCostoEnvio(-500.0);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        Venta venta = ventaService.registrarVenta(pedido);

        assertEquals(0.0, venta.getCostoEnvio());
        assertEquals(118.0, venta.getTotal());
    }

    @Test
    void descuentaElStockDeLaVarianteVendida() {
        detalle_producto variante = variante(100.0, 5);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante));
        guardarDevuelveLoRecibido();

        ventaService.registrarVenta(pedidoDe(3));

        assertEquals(2, variante.getStock());
    }

    @Test
    void bloqueaLaVarianteMientrasDescuentaElStock() {
        detalle_producto variante = variante(100.0, 5);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante));
        guardarDevuelveLoRecibido();

        ventaService.registrarVenta(pedidoDe(1));

        verify(detalleProductoRepository).findByIdForUpdate(4L);
    }

    @Test
    void guardaLaDireccionDeEntregaQueEscribioElComprador() {
        ClienteDto datos = new ClienteDto();
        datos.setNombre("Ana Torres");
        datos.setDireccion("Av. Brasil 1234");
        datos.setTelefono("999111222");

        VentaRequestDto pedido = pedidoDe(1);
        pedido.setCliente(datos);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        Venta venta = ventaService.registrarVenta(pedido);

        assertEquals("Ana Torres", venta.getNombreCliente());
        assertEquals("Av. Brasil 1234", venta.getDireccionEnvio());
        assertEquals("999111222", venta.getTelefonoCliente());
    }

    @Test
    void siElCompradorNoEscribeDireccionSeUsaLaDeSuCuenta() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        Venta venta = ventaService.registrarVenta(pedidoDe(1));

        assertEquals("Ana Torres", venta.getNombreCliente());
        assertEquals("Jesús María, Lima", venta.getDireccionEnvio());
    }

    @Test
    void marcaLaVentaComoOnlineSiNoSeIndicaElCanal() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        assertEquals("Online", ventaService.registrarVenta(pedidoDe(1)).getTipo_venta());
    }

    @Test
    void respetaElCanalPresencialCuandoLaVentaVieneDelPuntoDeVenta() {
        VentaRequestDto pedido = pedidoDe(1);
        pedido.setTipoVenta("Presencial");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante(100.0, 5)));
        guardarDevuelveLoRecibido();

        assertEquals("Presencial", ventaService.registrarVenta(pedido).getTipo_venta());
    }

    @Test
    void rechazaLaVentaSiNoHaySuficienteStockYNoTocaElInventario() {
        detalle_producto variante = variante(100.0, 2);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(cliente()));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante));
        guardarDevuelveLoRecibido();

        assertThrows(StockInsuficienteException.class, () -> ventaService.registrarVenta(pedidoDe(5)));

        assertEquals(2, variante.getStock());
        verify(detalleProductoRepository, never()).save(any());
    }

    @Test
    void rechazaUnaVentaSinProductos() {
        VentaRequestDto pedido = new VentaRequestDto();
        pedido.setUsuarioId(1L);
        pedido.setItems(List.of());

        assertThrows(IllegalArgumentException.class, () -> ventaService.registrarVenta(pedido));
    }

    @Test
    void anularUnaVentaDevuelveElStockAntesDeBorrarla() {
        Venta venta = new Venta();
        venta.setId(10L);

        detalle_producto variante = variante(100.0, 3);
        DetalleVenta detalle = new DetalleVenta();
        detalle.setCantidad(2);
        detalle.setDetalle_producto(variante);

        when(ventaRepository.findById(10L)).thenReturn(Optional.of(venta));
        when(detalleVentaRepository.findByVentaId(10L)).thenReturn(List.of(detalle));
        when(detalleProductoRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(variante));

        ventaService.eliminarVenta(10L);

        assertEquals(5, variante.getStock());
        verify(detalleProductoRepository).save(variante);
        verify(detalleVentaRepository).deleteAll(List.of(detalle));
        verify(ventaRepository).delete(venta);
    }
}
