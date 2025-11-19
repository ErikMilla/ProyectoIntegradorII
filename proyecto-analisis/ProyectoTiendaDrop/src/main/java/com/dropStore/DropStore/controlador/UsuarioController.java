
package com.dropStore.DropStore.controlador;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UsuarioController {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/clientes")
    public ResponseEntity<List<Usuario>> getClientes() {
        // Retorna todos los usuarios con rol 'CLIENTE'
        return ResponseEntity.ok(usuarioRepository.findByRol("CLIENTE"));
    }
}
