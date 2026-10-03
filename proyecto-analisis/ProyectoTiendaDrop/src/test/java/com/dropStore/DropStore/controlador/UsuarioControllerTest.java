package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.config.SecurityConfig;
import com.dropStore.DropStore.security.SessionUser;
import com.dropStore.DropStore.service.PasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UsuarioController.class)
@Import(SecurityConfig.class)
class UsuarioControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean UsuarioRepository usuarioRepository;
    @MockitoBean PasswordService passwordService;

    private UsernamePasswordAuthenticationToken admin;

    @BeforeEach
    void preparar() {
        SessionUser principal = new SessionUser(1L, "admin@dropstore.local", "ADMIN");
        admin = new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    void elAdministradorPuedeCrearUnUsuarioConLaClaveCifrada() throws Exception {
        when(usuarioRepository.findByCorreo("nuevo@dropstore.local")).thenReturn(Optional.empty());
        when(passwordService.cifrar("ClaveTemporal123")).thenReturn("hash-seguro");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocacion -> {
            Usuario usuario = invocacion.getArgument(0);
            usuario.setId(8L);
            return usuario;
        });

        mvc.perform(post("/api/usuarios")
                        .with(authentication(admin)).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"nombre":"María","apellido":"López","dni":"70112233",
                                "correo":"nuevo@dropstore.local","telefono":"999111222",
                                "direccion":"Lima","rol":"VENDEDOR","contraseña":"ClaveTemporal123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(8))
                .andExpect(jsonPath("$.rol").value("VENDEDOR"))
                .andExpect(jsonPath("$.contraseña").doesNotExist());

        verify(passwordService).cifrar("ClaveTemporal123");
    }

    @Test
    void noPermiteCambiarElCorreoPorUnoQueYaPerteneceAOtroUsuario() throws Exception {
        Usuario actual = usuario(8L, "actual@dropstore.local", "VENDEDOR");
        Usuario otro = usuario(9L, "ocupado@dropstore.local", "CLIENTE");
        when(usuarioRepository.findById(8L)).thenReturn(Optional.of(actual));
        when(usuarioRepository.findByCorreo("ocupado@dropstore.local")).thenReturn(Optional.of(otro));

        mvc.perform(put("/api/usuarios/8")
                        .with(authentication(admin)).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"nombre":"Actual","apellido":"Usuario","dni":"70112233",
                                "correo":"ocupado@dropstore.local","telefono":"999111222",
                                "direccion":"Lima","rol":"VENDEDOR","contraseña":""}
                                """))
                .andExpect(status().isBadRequest());

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void elAdministradorNoPuedeEliminarSuPropiaCuenta() throws Exception {
        when(usuarioRepository.existsById(1L)).thenReturn(true);

        mvc.perform(delete("/api/usuarios/1")
                        .with(authentication(admin)).with(csrf()))
                .andExpect(status().isBadRequest());

        verify(usuarioRepository, never()).deleteById(1L);
    }

    @Test
    void elAdministradorNoPuedeQuitarSuPropioRolDeAdministrador() throws Exception {
        Usuario actual = usuario(1L, "admin@dropstore.local", "ADMIN");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(actual));
        when(usuarioRepository.findByCorreo("admin@dropstore.local")).thenReturn(Optional.of(actual));

        mvc.perform(put("/api/usuarios/1")
                        .with(authentication(admin)).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {"nombre":"Administrador","apellido":"Drop","dni":"70000001",
                                "correo":"admin@dropstore.local","telefono":"999111222",
                                "direccion":"Lima","rol":"VENDEDOR","contraseña":""}
                                """))
                .andExpect(status().isBadRequest());

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void elAdministradorPuedeEliminarOtroUsuario() throws Exception {
        when(usuarioRepository.existsById(8L)).thenReturn(true);

        mvc.perform(delete("/api/usuarios/8")
                        .with(authentication(admin)).with(csrf()))
                .andExpect(status().isNoContent());

        verify(usuarioRepository).deleteById(8L);
    }

    private Usuario usuario(Long id, String correo, String rol) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre("Actual");
        usuario.setApellido("Usuario");
        usuario.setCorreo(correo);
        usuario.setRol(rol);
        usuario.setContraseña("hash-existente");
        return usuario;
    }
}
