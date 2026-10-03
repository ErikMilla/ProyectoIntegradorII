package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Resena;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Repositorio.ProductoRepository;
import com.dropStore.DropStore.Repositorio.ResenaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.security.SessionUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ResenaControllerTest {

    @Mock ResenaRepository resenaRepository;
    @Mock ProductoRepository productoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock DetalleVentaRepository detalleVentaRepository;
    @InjectMocks ResenaController controller;

    private producto zapatilla;
    private Usuario cliente;
    private Authentication autenticacion;

    @BeforeEach
    void preparar() {
        zapatilla = new producto();
        zapatilla.setId(2L);
        zapatilla.setNombre("Nike Air Force 1");

        cliente = new Usuario();
        cliente.setId(7L);
        cliente.setNombre("Ana");
        cliente.setApellido("Torres");
        autenticacion = new UsernamePasswordAuthenticationToken(
                new SessionUser(7L, "ana@correo.com", "CLIENTE"), null, List.of());

        when(productoRepository.existsById(2L)).thenReturn(true);
        when(productoRepository.findById(2L)).thenReturn(Optional.of(zapatilla));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(cliente));
        when(resenaRepository.save(any(Resena.class))).thenAnswer(llamada -> llamada.getArgument(0));
    }

    private Resena resena(int estrellas) {
        Resena resena = new Resena();
        resena.setId(1L);
        resena.setProducto(zapatilla);
        resena.setUsuario(cliente);
        resena.setCalificacion(estrellas);
        resena.setComentario("Muy buenas");
        resena.setFecha(new Date());
        return resena;
    }

    private Map<String, Object> cuerpo(Object usuarioId, Object calificacion, Object comentario) {
        return Map.of(
                "usuarioId", usuarioId,
                "calificacion", calificacion,
                "comentario", comentario);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapaDe(ResponseEntity<?> respuesta) {
        return (Map<String, Object>) respuesta.getBody();
    }

    // ----------------------------------------------------------------- listar

    @Test
    void calculaElPromedioDeEstrellas() {
        when(resenaRepository.findByProducto_IdOrderByFechaDesc(2L))
                .thenReturn(List.of(resena(5), resena(4), resena(5)));

        Map<String, Object> cuerpo = mapaDe(controller.listar(2L));

        assertEquals(3, cuerpo.get("total"));
        assertEquals(4.7, cuerpo.get("promedio")); // (5+4+5)/3 = 4.666… -> 4.7
    }

    @Test
    void unProductoSinResenasDevuelvePromedioCero() {
        when(resenaRepository.findByProducto_IdOrderByFechaDesc(2L)).thenReturn(List.of());

        Map<String, Object> cuerpo = mapaDe(controller.listar(2L));

        assertEquals(0, cuerpo.get("total"));
        assertEquals(0.0, cuerpo.get("promedio"));
    }

    @Test
    void noExponeElCorreoDelAutorSinoSuNombreAbreviado() {
        when(resenaRepository.findByProducto_IdOrderByFechaDesc(2L)).thenReturn(List.of(resena(5)));

        Map<String, Object> cuerpo = mapaDe(controller.listar(2L));
        List<?> items = (List<?>) cuerpo.get("items");
        Map<?, ?> primera = assertInstanceOf(Map.class, items.get(0));

        assertEquals("Ana T.", primera.get("autor"));
        assertEquals(false, primera.containsKey("correo"));
    }

    @Test
    void devuelve404SiElProductoNoExiste() {
        when(productoRepository.existsById(99L)).thenReturn(false);

        assertEquals(HttpStatus.NOT_FOUND, controller.listar(99L).getStatusCode());
    }

    // ------------------------------------------------------------------ crear

    @Test
    void publicaLaResenaCuandoLosDatosSonValidos() {
        when(detalleVentaRepository.existsCompraDeProductoPorUsuario(2L, 7L)).thenReturn(true);
        when(resenaRepository.existsByProducto_IdAndUsuario_Id(2L, 7L)).thenReturn(false);

        ResponseEntity<?> respuesta = controller.crear(2L, cuerpo(7, 5, "Excelente calidad"), autenticacion);

        assertEquals(HttpStatus.CREATED, respuesta.getStatusCode());
        verify(resenaRepository).save(any(Resena.class));
    }

    @Test
    void rechazaLaResenaSiElClienteNoComproElProducto() {
        when(detalleVentaRepository.existsCompraDeProductoPorUsuario(2L, 7L)).thenReturn(false);

        ResponseEntity<?> respuesta = controller.crear(2L, cuerpo(7, 5, "Excelente"), autenticacion);

        assertEquals(HttpStatus.FORBIDDEN, respuesta.getStatusCode());
        verify(resenaRepository, never()).save(any());
    }

    @Test
    void rechazaUnaCalificacionFueraDeRango() {
        assertEquals(HttpStatus.BAD_REQUEST, controller.crear(2L, cuerpo(7, 9, "test"), autenticacion).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, controller.crear(2L, cuerpo(7, 0, "test"), autenticacion).getStatusCode());
        verify(resenaRepository, never()).save(any());
    }

    @Test
    void rechazaUnComentarioVacio() {
        assertEquals(HttpStatus.BAD_REQUEST, controller.crear(2L, cuerpo(7, 5, "   "), autenticacion).getStatusCode());
        verify(resenaRepository, never()).save(any());
    }

    @Test
    void impideQueElMismoClienteOpineDosVecesDelMismoProducto() {
        when(detalleVentaRepository.existsCompraDeProductoPorUsuario(2L, 7L)).thenReturn(true);
        when(resenaRepository.existsByProducto_IdAndUsuario_Id(2L, 7L)).thenReturn(true);

        ResponseEntity<?> respuesta = controller.crear(2L, cuerpo(7, 5, "Otra opinión"), autenticacion);

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        verify(resenaRepository, never()).save(any());
    }

    @Test
    void ignoraElUsuarioEnviadoPorElNavegadorYUsaLaSesion() {
        when(detalleVentaRepository.existsCompraDeProductoPorUsuario(2L, 7L)).thenReturn(true);
        when(resenaRepository.existsByProducto_IdAndUsuario_Id(2L, 7L)).thenReturn(false);

        controller.crear(2L, cuerpo(999, 5, "Excelente"), autenticacion);

        verify(usuarioRepository).findById(7L);
        verify(usuarioRepository, never()).findById(999L);
    }
}
