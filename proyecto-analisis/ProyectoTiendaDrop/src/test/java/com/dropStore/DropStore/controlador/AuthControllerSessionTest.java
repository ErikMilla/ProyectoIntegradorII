package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.config.SecurityConfig;
import com.dropStore.DropStore.service.PasswordService;
import com.dropStore.DropStore.service.EmailMfaService;
import com.dropStore.DropStore.service.MfaChallenge;
import com.dropStore.DropStore.service.MfaVerification;
import com.dropStore.DropStore.service.PendingRegistration;
import com.dropStore.DropStore.service.RegistrationChallenge;
import com.dropStore.DropStore.service.RegistrationVerification;
import com.dropStore.DropStore.service.RegistrationVerificationService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerSessionTest {

    @Autowired MockMvc mvc;
    @MockitoBean UsuarioRepository usuarioRepository;
    @MockitoBean PasswordService passwordService;
    @MockitoBean EmailMfaService emailMfaService;
    @MockitoBean RegistrationVerificationService registrationVerificationService;

    private Usuario usuario;

    @BeforeEach
    void preparar() {
        usuario = new Usuario();
        usuario.setId(7L);
        usuario.setCorreo("ana@correo.com");
        usuario.setNombre("Ana");
        usuario.setRol("CLIENTE");
        usuario.setContraseña("hash");
        when(usuarioRepository.findByCorreo("ana@correo.com")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        when(passwordService.tieneContrasena(usuario)).thenReturn(true);
        when(passwordService.coincide(usuario, "ClaveSegura123")).thenReturn(true);
        when(passwordService.estaCifrada("hash")).thenReturn(true);
    }

    @Test
    void elLoginCreaUnaSesionQueElServidorPuedeVerificar() throws Exception {
        MvcResult login = mvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"correo\":\"ana@correo.com\",\"contraseña\":\"ClaveSegura123\"}"))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession sesion = (MockHttpSession) login.getRequest().getSession(false);
        mvc.perform(get("/api/auth/verificar").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void elLoginSinProteccionCsrfEsRechazado() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"correo\":\"ana@correo.com\",\"contraseña\":\"ClaveSegura123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void elLoginAceptaElTokenCsrfDeLaCookieComoLoEnviaAxios() throws Exception {
        MvcResult tokenResponse = mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        Cookie csrfCookie = tokenResponse.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(csrfCookie);

        mvc.perform(post("/api/auth/login")
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType("application/json")
                        .content("{\"correo\":\"ana@correo.com\",\"contraseña\":\"ClaveSegura123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void unAdministradorNoObtieneSesionHastaValidarElCodigoMfa() throws Exception {
        usuario.setRol("ADMIN");
        when(emailMfaService.iniciar(org.mockito.ArgumentMatchers.eq(usuario),
                org.mockito.ArgumentMatchers.any()))
                .thenReturn(new MfaChallenge("reto-123", "a***n@correo.com", 300, null));

        MvcResult login = mvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"correo\":\"ana@correo.com\",\"contraseña\":\"ClaveSegura123\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.mfaRequired").value(true))
                .andExpect(jsonPath("$.challengeId").value("reto-123"))
                .andReturn();

        MockHttpSession sesion = (MockHttpSession) login.getRequest().getSession(false);
        mvc.perform(get("/api/auth/verificar").session(sesion))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void elCodigoMfaCorrectoCompletaLaSesionDelAdministrador() throws Exception {
        usuario.setRol("ADMIN");
        MockHttpSession sesion = new MockHttpSession();
        when(emailMfaService.verificar(org.mockito.ArgumentMatchers.eq(sesion),
                org.mockito.ArgumentMatchers.eq("reto-123"), org.mockito.ArgumentMatchers.eq("123456")))
                .thenReturn(MfaVerification.valido(7L));

        mvc.perform(post("/api/auth/mfa/verificar")
                        .session(sesion)
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"challengeId\":\"reto-123\",\"codigo\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));

        mvc.perform(get("/api/auth/verificar").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    void elRegistroNoCreaLaCuentaAntesDeConfirmarElCorreo() throws Exception {
        when(usuarioRepository.findByCorreo("nuevo@correo.com")).thenReturn(Optional.empty());
        when(passwordService.cifrar("ClaveNueva123")).thenReturn("hash-bcrypt");
        when(registrationVerificationService.iniciar(any(Usuario.class),
                org.mockito.ArgumentMatchers.isNull(), any()))
                .thenReturn(new RegistrationChallenge("registro-123", "n***o@correo.com", 300, null));

        mvc.perform(post("/api/auth/registro")
                        .with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"nombre":"Nuevo","apellido":"Cliente","dni":"76543210",
                                "correo":"nuevo@correo.com","telefono":"999888777","direccion":"Lima",
                                "contraseña":"ClaveNueva123","confircontraseña":"ClaveNueva123"}
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.verificationRequired").value(true))
                .andExpect(jsonPath("$.challengeId").value("registro-123"));

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void confirmarElCorreoCreaLaCuentaCliente() throws Exception {
        MockHttpSession sesion = new MockHttpSession();
        PendingRegistration pendiente = new PendingRegistration(null, "76543210", "Nuevo", "Cliente",
                "nuevo@correo.com", "999888777", "Lima", "hash-bcrypt");
        when(registrationVerificationService.verificar(sesion, "registro-123", "123456"))
                .thenReturn(RegistrationVerification.valido(pendiente));
        when(usuarioRepository.findByCorreo("nuevo@correo.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocacion -> {
            Usuario guardado = invocacion.getArgument(0);
            guardado.setId(9L);
            return guardado;
        });

        mvc.perform(post("/api/auth/registro/verificar")
                        .session(sesion)
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"challengeId\":\"registro-123\",\"codigo\":\"123456\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(9))
                .andExpect(jsonPath("$.rol").value("CLIENTE"));
    }
}
