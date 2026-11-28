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
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CP16: un VENDEDOR no puede editar un cliente. El servidor responde 403 y
 * los datos del cliente no cambian. Usa la cadena real de SecurityConfig con
 * un token CSRF válido, igual que ResenaSecurityTest.
 */
@WebMvcTest(UsuarioController.class)
@Import(SecurityConfig.class)
class UsuarioSecurityTest {

    /** Intento de cambiar nombre, correo y rol del cliente 8. */
    private static final String CAMBIOS = """
            {"nombre":"Cambiado","apellido":"Por Vendedor","dni":"70000000",
            "correo":"otro@dropstore.local","telefono":"900000000",
            "direccion":"Otra dirección","rol":"ADMIN","contraseña":""}
            """;

    @Autowired MockMvc mvc;
    @MockitoBean UsuarioRepository usuarioRepository;
    @MockitoBean PasswordService passwordService;

    private Usuario cliente;

    @BeforeEach
    void preparar() {
        cliente = new Usuario();
        cliente.setId(8L);
        cliente.setNombre("Ana");
        cliente.setApellido("Torres");
        cliente.setDni("70112233");
        cliente.setCorreo("cliente@dropstore.local");
        cliente.setTelefono("999111222");
        cliente.setDireccion("Lima");
        cliente.setRol("CLIENTE");

        when(usuarioRepository.findById(8L)).thenReturn(Optional.of(cliente));
        when(usuarioRepository.findByCorreo(any())).thenReturn(Optional.empty());
        when(usuarioRepository.findByRol("CLIENTE")).thenReturn(List.of(cliente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(llamada -> llamada.getArgument(0));
    }

    private static RequestPostProcessor sesion(long id, String rol) {
        return authentication(new UsernamePasswordAuthenticationToken(
                new SessionUser(id, "usuario" + id + "@dropstore.local", rol), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    private void assertClienteSinCambios() {
        assertEquals("Ana", cliente.getNombre());
        assertEquals("Torres", cliente.getApellido());
        assertEquals("cliente@dropstore.local", cliente.getCorreo());
        assertEquals("CLIENTE", cliente.getRol());
        verify(usuarioRepository, never()).findById(anyLong());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void cp16_unVendedorNoPuedeEditarUnCliente() throws Exception {
        mvc.perform(put("/api/usuarios/8").with(sesion(5, "VENDEDOR")).with(csrf())
                        .contentType("application/json").content(CAMBIOS))
                .andExpect(status().isForbidden());

        assertClienteSinCambios();
    }

    @Test
    void cp16_unVendedorNoPuedeEliminarUnCliente() throws Exception {
        mvc.perform(delete("/api/usuarios/8").with(sesion(5, "VENDEDOR")).with(csrf()))
                .andExpect(status().isForbidden());

        verify(usuarioRepository, never()).deleteById(anyLong());
    }

    @Test
    void cp16_elVendedorSiPuedeVerLaListaDeClientes() throws Exception {
        mvc.perform(get("/api/usuarios/clientes").with(sesion(5, "VENDEDOR")))
                .andExpect(status().isOk());
    }

    @Test
    void unClienteNoPuedeEditarOtraCuenta() throws Exception {
        mvc.perform(put("/api/usuarios/8").with(sesion(9, "CLIENTE")).with(csrf())
                        .contentType("application/json").content(CAMBIOS))
                .andExpect(status().isForbidden());

        assertClienteSinCambios();
    }

    @Test
    void sinSesionNoSePuedeEditarUnUsuario() throws Exception {
        mvc.perform(put("/api/usuarios/8").with(csrf())
                        .contentType("application/json").content(CAMBIOS))
                .andExpect(status().isUnauthorized());

        assertClienteSinCambios();
    }

    /** Control: la misma petición sí la acepta un ADMIN, así que el 403 se debe al rol. */
    @Test
    void elAdministradorSiPuedeEditarElCliente() throws Exception {
        mvc.perform(put("/api/usuarios/8").with(sesion(1, "ADMIN")).with(csrf())
                        .contentType("application/json").content(CAMBIOS))
                .andExpect(status().isOk());

        assertEquals("Cambiado", cliente.getNombre());
        verify(usuarioRepository).save(cliente);
    }
}
