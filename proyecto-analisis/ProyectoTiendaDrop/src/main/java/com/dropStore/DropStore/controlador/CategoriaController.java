
package com.dropStore.DropStore.controlador;
import com.dropStore.DropStore.Modelo.categoria;
import com.dropStore.DropStore.Repositorio.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CategoriaController {
    @Autowired
    private CategoriaRepository categoriaRepository;

    // GET: Obtener todas las categorías
    @GetMapping
    public List<categoria> getAllCategorias() {
        return categoriaRepository.findAll();
    }

    // GET: Obtener una categoría por ID
    @GetMapping("/{id}")
    public ResponseEntity<categoria> getCategoriaById(@PathVariable Long id) {
        Optional<categoria> categoria = categoriaRepository.findById(id);
        return categoria.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST: Crear una nueva categoría
    @PostMapping
    public categoria createCategoria(@RequestBody categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    // PUT: Actualizar una categoría
    @PutMapping("/{id}")
    public ResponseEntity<categoria> updateCategoria(@PathVariable Long id, @RequestBody categoria categoriaDetails) {
        Optional<categoria> categoriaOpt = categoriaRepository.findById(id);

        if (categoriaOpt.isPresent()) {
            categoria categoria = categoriaOpt.get();
            categoria.setNombre(categoriaDetails.getNombre()); // Solo tiene el campo nombre
            return ResponseEntity.ok(categoriaRepository.save(categoria));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE: Eliminar una categoría
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategoria(@PathVariable Long id) {
        if (categoriaRepository.existsById(id)) {
            categoriaRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
