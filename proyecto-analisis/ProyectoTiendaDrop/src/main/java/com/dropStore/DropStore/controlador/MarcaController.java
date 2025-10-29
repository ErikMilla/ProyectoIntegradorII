/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.controlador;
import com.dropStore.DropStore.Modelo.marca;
import com.dropStore.DropStore.Repositorio.MarcaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/marcas")
// Aseguramos la comunicación con tu frontend en 5173
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MarcaController {
    @Autowired
    private MarcaRepository marcaRepository;

    // GET: Obtener todas las marcas
    @GetMapping
    public List<marca> getAllMarcas() {
        return marcaRepository.findAll();
    }

    // POST: Crear una nueva marca
    @PostMapping
    public marca createMarca(@RequestBody marca marca) {
        return marcaRepository.save(marca);
    }

    // PUT: Actualizar una marca
    @PutMapping("/{id}")
    public ResponseEntity<marca> updateMarca(@PathVariable Long id, @RequestBody marca marcaDetails) {
        Optional<marca> marcaOpt = marcaRepository.findById(id);

        if (marcaOpt.isPresent()) {
            marca marca = marcaOpt.get();
            marca.setNombre(marcaDetails.getNombre()); // Solo tiene el campo nombre
            return ResponseEntity.ok(marcaRepository.save(marca));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // DELETE: Eliminar una marca
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMarca(@PathVariable Long id) {
        if (marcaRepository.existsById(id)) {
            marcaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
