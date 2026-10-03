package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.service.PasswordService;
import com.dropStore.DropStore.service.EmailMfaService;
import com.dropStore.DropStore.service.MfaChallenge;
import com.dropStore.DropStore.service.MfaDeliveryException;
import com.dropStore.DropStore.service.MfaResendResult;
import com.dropStore.DropStore.service.MfaVerification;
import com.dropStore.DropStore.service.MfaRateLimitException;
import com.dropStore.DropStore.service.PendingRegistration;
import com.dropStore.DropStore.service.RegistrationChallenge;
import com.dropStore.DropStore.service.RegistrationVerification;
import com.dropStore.DropStore.service.RegistrationVerificationService;
import com.dropStore.DropStore.security.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordService passwordService;
    private final SecurityContextRepository securityContextRepository;
    private final EmailMfaService emailMfaService;
    private final RegistrationVerificationService registrationVerificationService;
    private static final Set<String> ROLES_CON_MFA = Set.of("ADMIN", "ALMACENERO");

    public AuthController(UsuarioRepository usuarioRepository, PasswordService passwordService,
                          SecurityContextRepository securityContextRepository,
                          EmailMfaService emailMfaService,
                          RegistrationVerificationService registrationVerificationService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordService = passwordService;
        this.securityContextRepository = securityContextRepository;
        this.emailMfaService = emailMfaService;
        this.registrationVerificationService = registrationVerificationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales,
                                   HttpServletRequest request, HttpServletResponse response) {
        String correo = credenciales.get("correo");
        String contrasena = credenciales.get("contraseña");

        if (correo == null || correo.isBlank() || contrasena == null || contrasena.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresa tu correo y tu contraseña."));
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo.trim());
        if (usuarioOpt.isEmpty()) {
            // Mismo mensaje que para contrasena incorrecta: no revelamos que
            // correos estan registrados.
            return credencialesInvalidas();
        }

        Usuario usuario = usuarioOpt.get();

        // Los clientes creados desde el panel de administracion no tienen
        // contrasena. Antes esto provocaba un error 500; ahora se explica.
        if (!passwordService.tieneContrasena(usuario)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Esta cuenta aún no tiene contraseña. Regístrate con este correo para activarla."));
        }

        if (!passwordService.coincide(usuario, contrasena)) {
            return credencialesInvalidas();
        }

        // Si la contrasena seguia en texto plano, se migra a BCrypt ahora que
        // sabemos que es la correcta.
        if (!passwordService.estaCifrada(usuario.getContraseña())) {
            usuario.setContraseña(passwordService.cifrar(contrasena));
            usuarioRepository.save(usuario);
        }

        if (ROLES_CON_MFA.contains(usuario.getRol())) {
            try {
                if (request.getSession(false) != null) request.changeSessionId();
                MfaChallenge challenge = emailMfaService.iniciar(usuario, request.getSession(true));
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("mfaRequired", true);
                respuesta.put("challengeId", challenge.id());
                respuesta.put("correoEnmascarado", challenge.correoEnmascarado());
                respuesta.put("expiraEnSegundos", challenge.expiraEnSegundos());
                if (challenge.codigoDesarrollo() != null) {
                    respuesta.put("codigoDesarrollo", challenge.codigoDesarrollo());
                }
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(respuesta);
            } catch (MfaRateLimitException ex) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "error", "Espera antes de solicitar otro código.",
                        "esperaSegundos", ex.getEsperaSegundos()));
            } catch (MfaDeliveryException ex) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                        "error", "No pudimos enviar el código de acceso. Inténtalo nuevamente."));
            }
        }

        autenticar(usuario, request, response);

        return ResponseEntity.ok(datosPublicos(usuario));
    }

    @PostMapping("/mfa/verificar")
    public ResponseEntity<?> verificarMfa(@RequestBody Map<String, String> datos,
                                          HttpServletRequest request, HttpServletResponse response) {
        String challengeId = datos.get("challengeId");
        String codigo = datos.get("codigo");
        if (challengeId == null || challengeId.isBlank() || codigo == null || !codigo.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresa el código de 6 dígitos."));
        }

        MfaVerification resultado = emailMfaService.verificar(request.getSession(false), challengeId, codigo);
        if (!resultado.valido()) {
            return respuestaErrorMfa(resultado);
        }

        Optional<Usuario> usuario = usuarioRepository.findById(resultado.usuarioId());
        if (usuario.isEmpty() || !ROLES_CON_MFA.contains(usuario.get().getRol())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "La verificación ya no es válida."));
        }

        autenticar(usuario.get(), request, response);
        return ResponseEntity.ok(datosPublicos(usuario.get()));
    }

    @PostMapping("/mfa/reenviar")
    public ResponseEntity<?> reenviarMfa(@RequestBody Map<String, String> datos,
                                         HttpServletRequest request) {
        String challengeId = datos.get("challengeId");
        if (challengeId == null || challengeId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La verificación no es válida."));
        }

        try {
            MfaResendResult resultado = emailMfaService.reenviar(request.getSession(false), challengeId);
            if (resultado.enviado()) {
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("message", "Enviamos un nuevo código.");
                respuesta.put("expiraEnSegundos", resultado.expiraEnSegundos());
                if (resultado.codigoDesarrollo() != null) {
                    respuesta.put("codigoDesarrollo", resultado.codigoDesarrollo());
                }
                return ResponseEntity.ok(respuesta);
            }
            if (resultado.status() == MfaResendResult.Status.ESPERA) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "error", "Espera antes de solicitar otro código.",
                        "esperaSegundos", resultado.esperaSegundos()));
            }
            String mensaje = resultado.status() == MfaResendResult.Status.EXPIRADO
                    ? "El código venció. Inicia sesión nuevamente."
                    : "La verificación ya no es válida.";
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", mensaje));
        } catch (MfaRateLimitException ex) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "error", "Espera antes de solicitar otro código.",
                    "esperaSegundos", ex.getEsperaSegundos()));
        } catch (MfaDeliveryException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "No pudimos enviar otro código. Inténtalo nuevamente."));
        }
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Usuario usuario, HttpServletRequest request) {
        if (usuario.getCorreo() == null || usuario.getCorreo().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo es obligatorio."));
        }
        if (!usuario.getCorreo().trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresa un correo válido."));
        }
        if (usuario.getNombre() == null || usuario.getNombre().isBlank()
                || usuario.getApellido() == null || usuario.getApellido().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre y apellido son obligatorios."));
        }
        if (usuario.getContraseña() == null || usuario.getContraseña().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña es obligatoria."));
        }
        if (usuario.getContraseña().length() < 12) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "La contraseña debe tener al menos 12 caracteres."));
        }
        if (!usuario.getContraseña().equals(usuario.getConfircontraseña())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Las contraseñas no coinciden."));
        }

        String correo = usuario.getCorreo().trim().toLowerCase();
        Optional<Usuario> existente = usuarioRepository.findByCorreo(correo);

        // Un cliente registrado desde el panel admin existe pero sin contrasena.
        // En ese caso el registro activa la cuenta en lugar de ser rechazado.
        if (existente.isPresent()) {
            if (passwordService.tieneContrasena(existente.get())) {
                return ResponseEntity.badRequest().body(Map.of("error", "El correo ya está registrado."));
            }
        }

        usuario.setCorreo(correo);
        usuario.setContraseña(passwordService.cifrar(usuario.getContraseña()));
        usuario.setRol("CLIENTE");
        try {
            RegistrationChallenge challenge = registrationVerificationService.iniciar(
                    usuario, existente.map(Usuario::getId).orElse(null), request.getSession(true));
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(datosChallengeRegistro(challenge));
        } catch (MfaRateLimitException ex) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "error", "Espera antes de solicitar otro código.",
                    "esperaSegundos", ex.getEsperaSegundos()));
        } catch (MfaDeliveryException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "No pudimos enviar el código de verificación."));
        }
    }

    @PostMapping("/registro/verificar")
    public ResponseEntity<?> verificarRegistro(@RequestBody Map<String, String> datos,
                                                HttpServletRequest request) {
        String challengeId = datos.get("challengeId");
        String codigo = datos.get("codigo");
        if (challengeId == null || challengeId.isBlank() || codigo == null || !codigo.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresa el código de 6 dígitos."));
        }

        RegistrationVerification resultado = registrationVerificationService.verificar(
                request.getSession(false), challengeId, codigo);
        if (!resultado.valido()) return respuestaErrorRegistro(resultado);

        PendingRegistration pendiente = resultado.registro();
        Usuario usuario;
        HttpStatus estado;
        if (pendiente.usuarioExistenteId() != null) {
            Optional<Usuario> existente = usuarioRepository.findById(pendiente.usuarioExistenteId());
            if (existente.isEmpty() || passwordService.tieneContrasena(existente.get())
                    || !pendiente.correo().equalsIgnoreCase(existente.get().getCorreo())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "La cuenta cambió durante la verificación. Inicia el registro nuevamente."));
            }
            usuario = existente.get();
            estado = HttpStatus.OK;
        } else {
            if (usuarioRepository.findByCorreo(pendiente.correo()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "El correo ya está registrado."));
            }
            usuario = new Usuario();
            usuario.setCorreo(pendiente.correo());
            usuario.setRol("CLIENTE");
            usuario.setFechacreacion(new Date());
            estado = HttpStatus.CREATED;
        }

        aplicarRegistro(usuario, pendiente);
        return ResponseEntity.status(estado).body(datosPublicos(usuarioRepository.save(usuario)));
    }

    @PostMapping("/registro/reenviar")
    public ResponseEntity<?> reenviarRegistro(@RequestBody Map<String, String> datos,
                                               HttpServletRequest request) {
        String challengeId = datos.get("challengeId");
        if (challengeId == null || challengeId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La verificación no es válida."));
        }
        try {
            MfaResendResult resultado = registrationVerificationService.reenviar(
                    request.getSession(false), challengeId);
            if (resultado.enviado()) {
                Map<String, Object> respuesta = new HashMap<>();
                respuesta.put("message", "Enviamos un nuevo código.");
                respuesta.put("expiraEnSegundos", resultado.expiraEnSegundos());
                if (resultado.codigoDesarrollo() != null) {
                    respuesta.put("codigoDesarrollo", resultado.codigoDesarrollo());
                }
                return ResponseEntity.ok(respuesta);
            }
            if (resultado.status() == MfaResendResult.Status.ESPERA) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "error", "Espera antes de solicitar otro código.",
                        "esperaSegundos", resultado.esperaSegundos()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", resultado.status() == MfaResendResult.Status.EXPIRADO
                            ? "El código venció. Completa nuevamente el registro."
                            : "La verificación ya no es válida."));
        } catch (MfaRateLimitException ex) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "error", "Espera antes de solicitar otro código.",
                    "esperaSegundos", ex.getEsperaSegundos()));
        } catch (MfaDeliveryException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "No pudimos reenviar el código."));
        }
    }

    @GetMapping("/verificar")
    public ResponseEntity<?> verificarSesion(Authentication autenticacion) {
        if (autenticacion == null || !(autenticacion.getPrincipal() instanceof SessionUser sesion)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Sesión inválida"));
        }
        return usuarioRepository.findById(sesion.id())
                .<ResponseEntity<?>>map(usuario -> ResponseEntity.ok(datosPublicos(usuario)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Sesión inválida")));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    private ResponseEntity<?> credencialesInvalidas() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Correo o contraseña incorrectos."));
    }

    private ResponseEntity<?> respuestaErrorMfa(MfaVerification resultado) {
        if (resultado.status() == MfaVerification.Status.BLOQUEADO) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "error", "Superaste el número de intentos. Inicia sesión nuevamente."));
        }
        if (resultado.status() == MfaVerification.Status.EXPIRADO) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "El código venció. Inicia sesión nuevamente."));
        }
        if (resultado.status() == MfaVerification.Status.INCORRECTO) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "El código no es correcto.",
                    "intentosRestantes", resultado.intentosRestantes()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "La verificación ya no es válida."));
    }

    private ResponseEntity<?> respuestaErrorRegistro(RegistrationVerification resultado) {
        if (resultado.status() == RegistrationVerification.Status.BLOQUEADO) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "error", "Superaste el número de intentos. Completa nuevamente el registro."));
        }
        if (resultado.status() == RegistrationVerification.Status.EXPIRADO) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "El código venció. Completa nuevamente el registro."));
        }
        if (resultado.status() == RegistrationVerification.Status.INCORRECTO) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "El código no es correcto.",
                    "intentosRestantes", resultado.intentosRestantes()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "La verificación ya no es válida."));
    }

    private Map<String, Object> datosChallengeRegistro(RegistrationChallenge challenge) {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("verificationRequired", true);
        respuesta.put("challengeId", challenge.id());
        respuesta.put("correoEnmascarado", challenge.correoEnmascarado());
        respuesta.put("expiraEnSegundos", challenge.expiraEnSegundos());
        if (challenge.codigoDesarrollo() != null) {
            respuesta.put("codigoDesarrollo", challenge.codigoDesarrollo());
        }
        return respuesta;
    }

    private void aplicarRegistro(Usuario usuario, PendingRegistration pendiente) {
        usuario.setDni(pendiente.dni());
        usuario.setNombre(pendiente.nombre());
        usuario.setApellido(pendiente.apellido());
        usuario.setTelefono(pendiente.telefono());
        usuario.setDireccion(pendiente.direccion());
        usuario.setContraseña(pendiente.contrasenaCifrada());
    }

    private void autenticar(Usuario usuario, HttpServletRequest request, HttpServletResponse response) {
        SessionUser principal = new SessionUser(usuario.getId(), usuario.getCorreo(), usuario.getRol());
        Authentication autenticacion = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol())));
        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(autenticacion);
        SecurityContextHolder.setContext(contexto);
        if (request.getSession(false) != null) request.changeSessionId();
        securityContextRepository.saveContext(contexto, request, response);
    }

    /** Datos que puede ver el frontend. Nunca incluye la contraseña. */
    private Map<String, Object> datosPublicos(Usuario usuario) {
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("id", usuario.getId());
        respuesta.put("dni", usuario.getDni());
        respuesta.put("nombre", usuario.getNombre());
        respuesta.put("apellido", usuario.getApellido());
        respuesta.put("correo", usuario.getCorreo());
        respuesta.put("telefono", usuario.getTelefono());
        respuesta.put("direccion", usuario.getDireccion());
        respuesta.put("rol", usuario.getRol());
        return respuesta;
    }
}
