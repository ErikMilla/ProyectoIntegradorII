package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Dto.VentaRequestDto;
import com.dropStore.DropStore.Exception.StockInsuficienteException;
import com.dropStore.DropStore.Modelo.Venta;
import com.dropStore.DropStore.service.IVentaService; // Importas la interfaz
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ventas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VentaController {

    @Autowired
    private IVentaService ventaService;

    // Este es el endpoint que llamará React
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
}