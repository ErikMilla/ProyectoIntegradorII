package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Resena;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.ProductoRepository;
import com.dropStore.DropStore.Repositorio.ResenaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.config.SecurityConfig;
import com.dropStore.DropStore.security.SessionUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * INC01 (#27): las reglas de SecurityConfig no deben bloquear a un CLIENTE
 * que publica o borra su reseña, y tampoco deben abrir el resto de
 * /api/productos/** a ese rol.
 */
@WebMvcTest(ResenaController.class)
@Import(SecurityConfig.class)
class ResenaSecurityTest {

    private static final String RESENA = "{\"calificacion\":5,\"comentario\":\"Muy buenas\"}";

    @Autowired MockMvc mvc;
    @MockitoBean ResenaRepository resenaRepository;
    @MockitoBean ProductoRepository productoRepository;
    @MockitoBean UsuarioRepository usuarioRepository;
    @MockitoBean DetalleVentaRepository detalleVentaRepository;

    private Usuario cliente;
    private producto zapatilla;

    @BeforeEach
    void preparar() {
        zapatilla = new producto();
        zapatilla.setId(2L);
        cliente = new Usuario();
        cliente.setId(7L);
        cliente.setNombre("Ana");

        when(productoRepository.findById(2L)).thenReturn(Optional.of(zapatilla));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(cliente));
        when(detalleVentaRepository.existsCompraDeProductoPorUsuario(2L, 7L)).thenReturn(true);
        when(resenaRepository.existsByProducto_IdAndUsuario_Id(2L, 7L)).thenReturn(false);
        when(resenaRepository.save(any(Resena.class))).thenAnswer(llamada -> llamada.getArgument(0));
    }

    private static RequestPostProcessor sesion(long id, String rol) {
        return authentication(new UsernamePasswordAuthenticationToken(
                new SessionUser(id, "usuario" + id + "@correo.com", rol), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    private Resena resenaDe(long autorId) {
        Usuario autor = new Usuario();
        autor.setId(autorId);
        Resena resena = new Resena();
        resena.setId(1L);
        resena.setProducto(zapatilla);
        resena.setUsuario(autor);
        resena.setCalificacion(5);
        resena.setComentario("Muy buenas");
        resena.setFecha(new Date());
        return resena;
    }

    // --------------------------------------------------------------- publicar

    @Test
    void unClienteQueComproPuedePublicarSuResena() throws Exception {
        mvc.perform(post("/api/productos/2/resenas").with(sesion(7, "CLIENTE")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(RESENA))
                .andExpect(status().isCreated());
    }

    @Test
    void sinSesionNoSePuedePublicarUnaResena() throws Exception {
        mvc.perform(post("/api/productos/2/resenas").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(RESENA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unAlmaceneroNoPublicaResenas() throws Exception {
        mvc.perform(post("/api/productos/2/resenas").with(sesion(3, "ALMACENERO")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(RESENA))
                .andExpect(status().isForbidden());
    }

    @Test
    void unClienteSigueSinPoderCrearProductos() throws Exception {
        mvc.perform(post("/api/productos").with(sesion(7, "CLIENTE")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    // ----------------------------------------------------------------- borrar

    @Test
    void elAutorPuedeBorrarSuResena() throws Exception {
        when(resenaRepository.findById(1L)).thenReturn(Optional.of(resenaDe(7L)));

        mvc.perform(delete("/api/productos/2/resenas/1").with(sesion(7, "CLIENTE")).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void unClienteNoPuedeBorrarLaResenaDeOtro() throws Exception {
        when(resenaRepository.findById(1L)).thenReturn(Optional.of(resenaDe(8L)));

        mvc.perform(delete("/api/productos/2/resenas/1").with(sesion(7, "CLIENTE")).with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void sinSesionNoSePuedeBorrarUnaResena() throws Exception {
        mvc.perform(delete("/api/productos/2/resenas/1").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unClienteSigueSinPoderBorrarProductos() throws Exception {
        mvc.perform(delete("/api/productos/2").with(sesion(7, "CLIENTE")).with(csrf()))
                .andExpect(status().isForbidden());
    }
}
