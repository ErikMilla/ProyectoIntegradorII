package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Exception.StockInsuficienteException;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.service.IVentaService; // Importas la interfaz
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;
import com.dropStore.DropStore.Modelo.DetalleVenta;
import com.dropStore.DropStore.security.SessionUser;
import org.springframework.security.core.Authentication;
import com.dropStore.DropStore.service.ReporteService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/v1/ventas")
public class VentaController {

    @Autowired
    private IVentaService ventaService;

    @Autowired
    private com.dropStore.DropStore.Repositorio.VentaRepository ventaRepository;

    @Autowired
    private ReporteService reporteService;
    
    @PostMapping
    public ResponseEntity<?> crearVenta(@RequestBody VentaRequestDto ventaDto, Authentication autenticacion) {
        try {
            SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
            if ("CLIENTE".equals(sesion.rol())) {
                ventaDto.setUsuarioId(sesion.id());
            }
            Venta ventaCreada = ventaService.registrarVenta(ventaDto);
            // Si todo va bien, devolvemos 201 Created y la venta
            return new ResponseEntity<>(ventaCreada, HttpStatus.CREATED);
            
        } catch (StockInsuficienteException e) {
            // Si no hay stock, devolvemos 400 Bad Request
            // Usamos un Map para crear un JSON de error simple
            return new ResponseEntity<>(
                Map.of("message", e.getMessage()), 
                HttpStatus.BAD_REQUEST
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            // Para cualquier otro error (ej: Usuario no encontrado, Producto no encontrado)
            return new ResponseEntity<>(
                Map.of("message", e.getMessage()), 
                HttpStatus.INTERNAL_SERVER_ERROR // O 404 si prefieres
            );
        }
    }
    
        @GetMapping("/usuario/{id}")
    public ResponseEntity<List<Venta>> getVentasPorUsuario(@PathVariable Long id, Authentication autenticacion) {
        SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
        if ("CLIENTE".equals(sesion.rol()) && !sesion.id().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Venta> historial = ventaService.listarVentasPorUsuario(id);
        if (historial.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(historial);
    }
    
    @GetMapping("/todas")
    public ResponseEntity<List<Venta>> getAllVentas() {
        return ResponseEntity.ok(ventaRepository.findAllByOrderByFechaDesc());
    }

    @GetMapping("/pagina")
    public ResponseEntity<Page<Venta>> buscarVentas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        int tamanoSeguro = Math.min(Math.max(size, 1), 100);
        Date fechaDesde = desde == null ? null
                : Date.from(desde.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date fechaHasta = hasta == null ? null
                : Date.from(hasta.plusDays(1).atStartOfDay(ZoneId.systemDefault()).minusNanos(1).toInstant());
        String texto = q == null || q.isBlank() ? null : q.trim();
        return ResponseEntity.ok(ventaRepository.buscar(texto, fechaDesde, fechaHasta,
                PageRequest.of(Math.max(page, 0), tamanoSeguro)));
    }

    @GetMapping("/reportes/resumen")
    public ResponseEntity<Map<String, Object>> getResumenReportes() {
        return ResponseEntity.ok(reporteService.resumen());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDetalleVenta(@PathVariable Long id, Authentication autenticacion) {
        return ventaRepository.findById(id).map(venta -> {
            SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
            if ("CLIENTE".equals(sesion.rol())
                    && (venta.getUsuario() == null || !sesion.id().equals(venta.getUsuario().getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "No autorizado."));
            }
            List<Map<String, Object>> items = ventaService.listarDetalles(id).stream().map(detalle -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", detalle.getId());
                item.put("cantidad", detalle.getCantidad());
                item.put("precioUnitario", detalle.getCosto());
                item.put("varianteId", detalle.getDetalle_producto().getId());
                item.put("producto", detalle.getDetalle_producto().getProducto().getNombre());
                item.put("talla", detalle.getDetalle_producto().getTalla());
                item.put("color", detalle.getDetalle_producto().getColor());
                return item;
            }).collect(Collectors.toList());
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("venta", venta);
            response.put("items", items);
            return ResponseEntity.ok(response);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarVenta(@PathVariable Long id) {
        try {
            ventaService.eliminarVenta(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException error) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Venta no encontrada."));
        }
    }
}
