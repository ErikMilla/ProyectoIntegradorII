package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Dto.ClienteDto;
import com.dropStore.DropStore.Dto.DetalleVentaRequestDto;
import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Exception.StockInsuficienteException;
import com.dropStore.DropStore.Modelo.DetalleVenta;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.Modelo.detalle_producto;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.Repositorio.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Date;
import java.util.List;

/**
 * Registro de ventas: es el corazon del sistema, porque es donde una venta
 * descuenta el stock de forma inmediata, sin que nadie tenga que actualizar
 * nada a mano.
 *
 * Todo el metodo registrarVenta corre dentro de una transaccion: si falla
 * cualquier producto (por ejemplo, por falta de stock) no queda guardada ni la
 * venta ni los descuentos parciales.
 */
@Service
public class VentaServiceImpl implements IVentaService {

    private static final double TASA_IGV = 0.18;

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final DetalleProductoRepository detalleProductoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApplicationEventPublisher eventos;

    public VentaServiceImpl(VentaRepository ventaRepository,
                            DetalleVentaRepository detalleVentaRepository,
                            DetalleProductoRepository detalleProductoRepository,
                            UsuarioRepository usuarioRepository,
                            ApplicationEventPublisher eventos) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.detalleProductoRepository = detalleProductoRepository;
        this.usuarioRepository = usuarioRepository;
        this.eventos = eventos;
    }

    @Override
    @Transactional
    public Venta registrarVenta(VentaRequestDto ventaDto) {
        if (ventaDto.getItems() == null || ventaDto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La venta debe incluir al menos un producto.");
        }
        double tasaDescuento = tasaDescuentoDe(ventaDto.getCodigoDescuento());

        Usuario usuario = usuarioRepository.findById(ventaDto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + ventaDto.getUsuarioId()));

        Venta venta = new Venta();
        venta.setUsuario(usuario);
        venta.setFecha(new Date());
        venta.setMetodo_pago(ventaDto.getMetodoPago());
        venta.setTipo_venta(tipoVentaDe(ventaDto));
        venta.setCostoEnvio(Math.max(0, ventaDto.getCostoEnvio()));
        venta.setCodigoDescuento(tasaDescuento > 0 ? ventaDto.getCodigoDescuento().trim().toUpperCase() : null);
        venta.setDescuento(0.0);
        aplicarDatosDeEntrega(venta, usuario, ventaDto.getCliente());

        // Los totales se calculan en el servidor a partir de los precios
        // guardados en la base. Los que manda el navegador solo son
        // informativos: nunca se confia en ellos.
        venta.setSubtotal(0.0);
        venta.setIgv(0.0);
        venta.setTotal(0.0);

        Venta ventaGuardada = ventaRepository.save(venta);

        double subtotal = 0.0;
        for (DetalleVentaRequestDto item : ventaDto.getItems()) {
            if (item.getCantidad() <= 0) {
                throw new IllegalArgumentException("La cantidad de cada producto debe ser mayor a cero.");
            }

            detalle_producto variante = detalleProductoRepository.findByIdForUpdate(item.getDetalleProductoId())
                    .orElseThrow(() -> new RuntimeException(
                            "Producto (variante) no encontrado con ID: " + item.getDetalleProductoId()));

            if (variante.getStock() < item.getCantidad()) {
                // Al lanzar la excepcion, la transaccion revierte la venta completa.
                throw new StockInsuficienteException(
                        "Stock insuficiente para " + variante.getProducto().getNombre()
                                + " (talla " + variante.getTalla() + "). Quedan " + variante.getStock() + " unidades.");
            }

            variante.setStock(variante.getStock() - item.getCantidad());
            detalleProductoRepository.save(variante);

            double precioUnitario = variante.getProducto().getPrcio_venta();

            DetalleVenta detalle = new DetalleVenta();
            detalle.setVenta_id(ventaGuardada);
            detalle.setDetalle_producto(variante);
            detalle.setCantidad(item.getCantidad());
            detalle.setCosto(precioUnitario);
            detalleVentaRepository.save(detalle);

            subtotal += precioUnitario * item.getCantidad();
        }

        double descuento = subtotal * tasaDescuento;
        double baseConDescuento = subtotal - descuento;
        double igv = baseConDescuento * TASA_IGV;
        ventaGuardada.setSubtotal(subtotal);
        ventaGuardada.setDescuento(descuento);
        ventaGuardada.setIgv(igv);
        ventaGuardada.setTotal(baseConDescuento + igv + ventaGuardada.getCostoEnvio());

        Venta resultado = ventaRepository.save(ventaGuardada);
        eventos.publishEvent(new StockActualizadoEvent("venta"));
        return resultado;
    }

    /** Cupón público de demostración. El servidor decide el porcentaje. */
    private double tasaDescuentoDe(String codigo) {
        if (codigo == null || codigo.isBlank()) return 0;
        if ("DROP10".equalsIgnoreCase(codigo.trim())) return 0.10;
        throw new IllegalArgumentException("El cupón ingresado no existe o ya no está vigente.");
    }

    /** Online si viene del e-commerce, Presencial si viene del punto de venta. */
    private String tipoVentaDe(VentaRequestDto ventaDto) {
        String tipo = ventaDto.getTipoVenta();
        return (tipo == null || tipo.isBlank()) ? "Online" : tipo.trim();
    }

    /**
     * Copia los datos de entrega en la venta. Lo que el comprador escribe en el
     * formulario manda; si deja algo vacio se completa con lo que ya tiene
     * registrado en su cuenta.
     */
    private void aplicarDatosDeEntrega(Venta venta, Usuario usuario, ClienteDto cliente) {
        String nombrePorDefecto = (usuario.getNombre() == null ? "" : usuario.getNombre())
                + (usuario.getApellido() == null ? "" : " " + usuario.getApellido());

        if (cliente == null) {
            venta.setNombreCliente(nombrePorDefecto.trim());
            venta.setTelefonoCliente(usuario.getTelefono());
            venta.setDireccionEnvio(usuario.getDireccion());
            return;
        }

        venta.setNombreCliente(primeroNoVacio(cliente.getNombre(), nombrePorDefecto.trim()));
        venta.setTelefonoCliente(primeroNoVacio(cliente.getTelefono(), usuario.getTelefono()));
        venta.setDireccionEnvio(primeroNoVacio(cliente.getDireccion(), usuario.getDireccion()));
    }

    private String primeroNoVacio(String preferido, String respaldo) {
        return (preferido != null && !preferido.isBlank()) ? preferido.trim() : respaldo;
    }

    @Override
    public List<Venta> listarVentasPorUsuario(Long usuarioId) {
        return ventaRepository.findByUsuario_IdOrderByFechaDesc(usuarioId);
    }

    @Override
    public List<DetalleVenta> listarDetalles(Long ventaId) {
        if (!ventaRepository.existsById(ventaId)) {
            throw new RuntimeException("Venta no encontrada con ID: " + ventaId);
        }
        return detalleVentaRepository.findByVentaId(ventaId);
    }

    /** Anular una venta devuelve al inventario todo lo que se habia descontado. */
    @Override
    @Transactional
    public void eliminarVenta(Long ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con ID: " + ventaId));

        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaId(ventaId);
        for (DetalleVenta detalle : detalles) {
            Long varianteId = detalle.getDetalle_producto().getId();
            detalle_producto variante = detalleProductoRepository.findByIdForUpdate(varianteId)
                    .orElseThrow(() -> new RuntimeException("La variante de la venta ya no existe."));
            variante.setStock(variante.getStock() + detalle.getCantidad());
            detalleProductoRepository.save(variante);
        }

        detalleVentaRepository.deleteAll(detalles);
        ventaRepository.delete(venta);
        eventos.publishEvent(new StockActualizadoEvent("anulacion"));
    }
}
