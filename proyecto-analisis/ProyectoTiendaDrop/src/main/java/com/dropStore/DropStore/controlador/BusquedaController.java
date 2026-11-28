package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.service.BusquedaNaturalService;
import com.dropStore.DropStore.service.InterpreteConsulta;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Traduce lo que el cliente escribe en el buscador a filtros del catálogo.
 *
 * GET /api/productos/interpretar?q=nike blancas para mujer talla 38
 * es público, igual que el resto de lecturas de /api/productos.
 */
@RestController
@RequestMapping("/api/productos")
public class BusquedaController {

    private final BusquedaNaturalService busquedaNaturalService;

    public BusquedaController(BusquedaNaturalService busquedaNaturalService) {
        this.busquedaNaturalService = busquedaNaturalService;
    }

    @GetMapping("/interpretar")
    public ResponseEntity<?> interpretar(@RequestParam(name = "q", defaultValue = "") String consulta) {
        if (consulta.length() > InterpreteConsulta.MAX_LONGITUD) {
            return ResponseEntity.badRequest()
                    .body("La búsqueda no puede superar los " + InterpreteConsulta.MAX_LONGITUD + " caracteres.");
        }
        return ResponseEntity.ok(busquedaNaturalService.interpretar(consulta));
    }
}
