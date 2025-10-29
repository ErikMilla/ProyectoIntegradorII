package com.dropStore.DropStore.controlador;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String correo = credentials.get("correo");
        String contraseña = credentials.get("contraseña");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario no encontrado"));
        }

        Usuario usuario = usuarioOpt.get();

        // Comparar contraseñas (en producción, usa BCrypt)
        if (!usuario.getContraseña().equals(contraseña)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Contraseña incorrecta"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", usuario.getId());
        response.put("dni", usuario.getDni());
        response.put("nombre", usuario.getNombre());
        response.put("apellido", usuario.getApellido());
        response.put("correo", usuario.getCorreo());
        response.put("telefono", usuario.getTelefono());
        response.put("direccion", usuario.getDireccion());
        response.put("rol", usuario.getRol());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Usuario usuario) {
        // Validar que el correo no exista
        if (usuarioRepository.existsByCorreo(usuario.getCorreo())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "El correo ya está registrado"));
        }

        // Validar que las contraseñas coincidan
        if (!usuario.getContraseña().equals(usuario.getConfircontraseña())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Las contraseñas no coinciden"));
        }

        // Si no se especifica rol, asignar CLIENTE por defecto
        if (usuario.getRol() == null || usuario.getRol().isEmpty()) {
            usuario.setRol("CLIENTE");
        }

        // Establecer fecha de creación
        usuario.setFechacreacion(new Date());

        // Guardar usuario
        Usuario nuevoUsuario = usuarioRepository.save(usuario);

        Map<String, Object> response = new HashMap<>();
        response.put("id", nuevoUsuario.getId());
        response.put("dni", nuevoUsuario.getDni());
        response.put("nombre", nuevoUsuario.getNombre());
        response.put("apellido", nuevoUsuario.getApellido());
        response.put("correo", nuevoUsuario.getCorreo());
        response.put("telefono", nuevoUsuario.getTelefono());
        response.put("direccion", nuevoUsuario.getDireccion());
        response.put("rol", nuevoUsuario.getRol());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verificar")
    public ResponseEntity<?> verificarSesion(@RequestParam Long userId) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(userId);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sesión inválida"));
        }

        Usuario usuario = usuarioOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", usuario.getId());
        response.put("dni", usuario.getDni());
        response.put("nombre", usuario.getNombre());
        response.put("apellido", usuario.getApellido());
        response.put("correo", usuario.getCorreo());
        response.put("rol", usuario.getRol());

        return ResponseEntity.ok(response);
    }
}