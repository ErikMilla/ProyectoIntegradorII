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

@RestController
@RequestMapping("/api/v1/ventas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VentaController {

    @Autowired
    private IVentaService ventaService;

    @Autowired
    private com.dropStore.DropStore.Repositorio.VentaRepository ventaRepository;
    
    @PostMapping
    public ResponseEntity<?> crearVenta(@RequestBody VentaRequestDto ventaDto) {
        try {
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
        } catch (RuntimeException e) {
            // Para cualquier otro error (ej: Usuario no encontrado, Producto no encontrado)
            return new ResponseEntity<>(
                Map.of("message", e.getMessage()), 
                HttpStatus.INTERNAL_SERVER_ERROR // O 404 si prefieres
            );
        }
    }
    
        @GetMapping("/usuario/{id}")
    public ResponseEntity<List<Venta>> getVentasPorUsuario(@PathVariable Long id) {
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

    @GetMapping("/{id}")
    public ResponseEntity<?> getDetalleVenta(@PathVariable Long id) {
        return ventaRepository.findById(id).map(venta -> {
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
