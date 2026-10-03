package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.security.SessionUser;
import com.dropStore.DropStore.service.PasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private static final Set<String> ROLES_VALIDOS = Set.of("CLIENTE", "ADMIN", "ALMACENERO", "VENDEDOR");
    private static final Pattern CORREO_VALIDO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int LONGITUD_MINIMA_CLAVE = 12;

    private final UsuarioRepository usuarioRepository;
    private final PasswordService passwordService;

    public UsuarioController(UsuarioRepository usuarioRepository, PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordService = passwordService;
    }

    @GetMapping("/clientes")
    public ResponseEntity<List<Usuario>> getClientes() {
        return ResponseEntity.ok(usuarioRepository.findByRol("CLIENTE"));
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> getUsuarios() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody Usuario datos, Authentication autenticacion) {
        String errorComun = validarDatosComunes(datos);
        if (errorComun != null) {
            return ResponseEntity.badRequest().body(errorComun);
        }

        String correo = normalizarCorreo(datos.getCorreo());
        if (usuarioRepository.findByCorreo(correo).isPresent()) {
            return ResponseEntity.badRequest().body("El correo ya pertenece a otro usuario.");
        }

        SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
        boolean esAdministrador = "ADMIN".equals(sesion.rol());
        if (!esAdministrador) {
            datos.setRol("CLIENTE");
            datos.setContraseña(null);
        } else if ("CLIENTE".equals(datos.getRol())
                && (datos.getContraseña() == null || datos.getContraseña().isBlank())) {
            // El POS puede dar de alta clientes sin acceso web. El propio cliente
            // activara su acceso mas adelante mediante el registro con codigo.
            datos.setContraseña(null);
        } else {
            String errorClave = validarClaveNueva(datos.getContraseña());
            if (errorClave != null) {
                return ResponseEntity.badRequest().body(errorClave);
            }
            datos.setContraseña(passwordService.cifrar(datos.getContraseña()));
        }

        datos.setCorreo(correo);
        datos.setConfircontraseña(null);
        datos.setFechacreacion(new Date());
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioRepository.save(datos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario datos,
                                                Authentication autenticacion) {
        Optional<Usuario> existente = usuarioRepository.findById(id);
        if (existente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }

        String errorComun = validarDatosComunes(datos);
        if (errorComun != null) {
            return ResponseEntity.badRequest().body(errorComun);
        }

        String correo = normalizarCorreo(datos.getCorreo());
        Optional<Usuario> propietarioCorreo = usuarioRepository.findByCorreo(correo);
        if (propietarioCorreo.isPresent() && !propietarioCorreo.get().getId().equals(id)) {
            return ResponseEntity.badRequest().body("El correo ya pertenece a otro usuario.");
        }

        SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
        if (sesion.id().equals(id) && !"ADMIN".equals(datos.getRol())) {
            return ResponseEntity.badRequest().body("No puedes quitar el rol de tu propia cuenta.");
        }

        Usuario usuario = existente.get();
        usuario.setDni(datos.getDni());
        usuario.setNombre(datos.getNombre().trim());
        usuario.setApellido(limpiar(datos.getApellido()));
        usuario.setCorreo(correo);
        usuario.setTelefono(limpiar(datos.getTelefono()));
        usuario.setDireccion(limpiar(datos.getDireccion()));
        usuario.setRol(datos.getRol().trim().toUpperCase(Locale.ROOT));

        if (datos.getContraseña() != null && !datos.getContraseña().isBlank()) {
            String errorClave = validarClaveNueva(datos.getContraseña());
            if (errorClave != null) {
                return ResponseEntity.badRequest().body(errorClave);
            }
            usuario.setContraseña(passwordService.cifrar(datos.getContraseña()));
        }
        usuario.setConfircontraseña(null);
        return ResponseEntity.ok(usuarioRepository.save(usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, Authentication autenticacion) {
        SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
        if (sesion.id().equals(id)) {
            return ResponseEntity.badRequest().body("No puedes eliminar tu propia cuenta mientras la estas usando.");
        }
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String validarDatosComunes(Usuario datos) {
        if (datos.getNombre() == null || datos.getNombre().isBlank()) {
            return "El nombre es obligatorio.";
        }
        String correo = normalizarCorreo(datos.getCorreo());
        if (correo == null || !CORREO_VALIDO.matcher(correo).matches()) {
            return "Ingresa un correo valido.";
        }
        String rol = datos.getRol() == null ? "" : datos.getRol().trim().toUpperCase(Locale.ROOT);
        if (!ROLES_VALIDOS.contains(rol)) {
            return "El rol no es valido.";
        }
        datos.setNombre(datos.getNombre().trim());
        datos.setRol(rol);
        return null;
    }

    private String validarClaveNueva(String clave) {
        if (clave == null || clave.isBlank()) {
            return "La clave temporal es obligatoria.";
        }
        if (clave.length() < LONGITUD_MINIMA_CLAVE) {
            return "La clave debe tener al menos 12 caracteres.";
        }
        return null;
    }

    private String normalizarCorreo(String correo) {
        return correo == null ? null : correo.trim().toLowerCase(Locale.ROOT);
    }

    private String limpiar(String valor) {
        return valor == null ? null : valor.trim();
    }
}
