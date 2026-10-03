package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Modelo.Resena;
import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Repositorio.ProductoRepository;
import com.dropStore.DropStore.Repositorio.ResenaRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.security.SessionUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Comentarios y calificaciones de los clientes sobre un producto.
 *
 * Se publican bajo la ruta del producto porque siempre se consultan en el
 * contexto de su ficha: /api/productos/{id}/resenas
 */
@RestController
@RequestMapping("/api/productos/{productoId}/resenas")
public class ResenaController {

    private final ResenaRepository resenaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DetalleVentaRepository detalleVentaRepository;

    public ResenaController(ResenaRepository resenaRepository,
                            ProductoRepository productoRepository,
                            UsuarioRepository usuarioRepository,
                            DetalleVentaRepository detalleVentaRepository) {
        this.resenaRepository = resenaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.detalleVentaRepository = detalleVentaRepository;
    }

    /** Listado público: reseñas del producto más el promedio de estrellas. */
    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long productoId) {
        if (!productoRepository.existsById(productoId)) {
            return ResponseEntity.notFound().build();
        }

        List<Resena> resenas = resenaRepository.findByProducto_IdOrderByFechaDesc(productoId);

        double promedio = resenas.stream().mapToInt(Resena::getCalificacion).average().orElse(0);

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("total", resenas.size());
        // Redondeado a un decimal, que es como se muestra en la ficha (ej. 4.5).
        respuesta.put("promedio", Math.round(promedio * 10) / 10.0);
        respuesta.put("items", resenas.stream().map(this::aMapa).toList());

        return ResponseEntity.ok(respuesta);
    }

    /** Publicar una reseña. Un cliente solo puede opinar una vez por producto. */
    @PostMapping
    public ResponseEntity<?> crear(@PathVariable Long productoId, @RequestBody Map<String, Object> cuerpo,
                                   Authentication autenticacion) {
        Optional<producto> productoOpt = productoRepository.findById(productoId);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "El producto no existe."));
        }

        if (autenticacion == null || !(autenticacion.getPrincipal() instanceof SessionUser sesion)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Debes iniciar sesión para opinar."));
        }
        Long usuarioId = sesion.id();

        Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El usuario no existe."));
        }

        int calificacion = cuerpo.get("calificacion") instanceof Number numero ? numero.intValue() : 0;
        if (calificacion < 1 || calificacion > 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "La calificación debe estar entre 1 y 5 estrellas."));
        }

        String comentario = cuerpo.get("comentario") == null ? "" : cuerpo.get("comentario").toString().trim();
        if (comentario.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Escribe tu comentario."));
        }

        if (!detalleVentaRepository.existsCompraDeProductoPorUsuario(productoId, usuarioId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo puedes opinar sobre productos que hayas comprado."));
        }

        if (resenaRepository.existsByProducto_IdAndUsuario_Id(productoId, usuarioId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ya publicaste una reseña de este producto."));
        }

        Resena resena = new Resena();
        resena.setProducto(productoOpt.get());
        resena.setUsuario(usuarioOpt.get());
        resena.setCalificacion(calificacion);
        resena.setComentario(comentario);
        resena.setFecha(new Date());

        return ResponseEntity.status(HttpStatus.CREATED).body(aMapa(resenaRepository.save(resena)));
    }

    @DeleteMapping("/{resenaId}")
    public ResponseEntity<?> eliminar(@PathVariable Long productoId, @PathVariable Long resenaId,
                                      Authentication autenticacion) {
        Optional<Resena> resenaOpt = resenaRepository.findById(resenaId);
        if (resenaOpt.isEmpty() || resenaOpt.get().getProducto() == null
                || !productoId.equals(resenaOpt.get().getProducto().getId())) {
            return ResponseEntity.notFound().build();
        }
        SessionUser sesion = (SessionUser) autenticacion.getPrincipal();
        boolean esAutor = resenaOpt.get().getUsuario() != null
                && sesion.id().equals(resenaOpt.get().getUsuario().getId());
        if (!esAutor && !"ADMIN".equals(sesion.rol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "No autorizado."));
        }
        resenaRepository.delete(resenaOpt.get());
        return ResponseEntity.noContent().build();
    }

    /** Solo se expone el nombre del autor, nunca su correo ni su contraseña. */
    private Map<String, Object> aMapa(Resena resena) {
        Usuario autor = resena.getUsuario();
        String nombre = autor == null ? "Cliente" : autor.getNombre();
        String inicialApellido = (autor != null && autor.getApellido() != null && !autor.getApellido().isBlank())
                ? " " + autor.getApellido().charAt(0) + "."
                : "";

        Map<String, Object> mapa = new LinkedHashMap<>();
        mapa.put("id", resena.getId());
        mapa.put("autor", nombre + inicialApellido);
        mapa.put("calificacion", resena.getCalificacion());
        mapa.put("comentario", resena.getComentario());
        mapa.put("fecha", resena.getFecha());
        return mapa;
    }
}
