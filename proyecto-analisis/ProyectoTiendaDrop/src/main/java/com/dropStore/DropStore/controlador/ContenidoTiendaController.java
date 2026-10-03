package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.Dto.ContenidoTiendaDto;
import com.dropStore.DropStore.Modelo.ContenidoTienda;
import com.dropStore.DropStore.Repositorio.ContenidoTiendaRepository;
import com.dropStore.DropStore.service.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/contenido-tienda")
public class ContenidoTiendaController {
    private static final long CONTENIDO_ID = 1L;
    private static final Set<String> POSICIONES = Set.of("izquierda", "centro", "derecha");

    private final ContenidoTiendaRepository repository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public ContenidoTiendaController(ContenidoTiendaRepository repository,
                                     FileStorageService fileStorageService,
                                     ObjectMapper objectMapper) {
        this.repository = repository;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ContenidoTienda obtener() {
        return repository.findById(CONTENIDO_ID).orElseGet(ContenidoTienda::predeterminado);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<?> actualizar(@RequestParam("data") String data,
                                        @RequestParam(value = "file", required = false) MultipartFile file) {
        ContenidoTiendaDto dto;
        try {
            dto = objectMapper.readValue(data, ContenidoTiendaDto.class);
        } catch (IOException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", "Los datos del banner no son válidos."));
        }

        String error = validar(dto);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));

        ContenidoTienda contenido = repository.findById(CONTENIDO_ID)
                .orElseGet(ContenidoTienda::predeterminado);
        contenido.setEtiqueta(dto.getEtiqueta().trim());
        contenido.setTitulo(dto.getTitulo().trim());
        contenido.setTextoBoton(dto.getTextoBoton().trim());
        contenido.setEnlaceBoton(dto.getEnlaceBoton().trim());
        contenido.setMensajePromocional(dto.getMensajePromocional().trim());
        contenido.setAlturaEscritorio(dto.getAlturaEscritorio());
        contenido.setAlturaMovil(dto.getAlturaMovil());
        contenido.setPosicionImagen(dto.getPosicionImagen());

        if (file != null && !file.isEmpty()) {
            try {
                contenido.setImagenBanner(fileStorageService.storeFile(file));
            } catch (IllegalArgumentException exception) {
                return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
            }
        }

        return ResponseEntity.ok(repository.save(contenido));
    }

    private String validar(ContenidoTiendaDto dto) {
        if (dto == null || vacio(dto.getTitulo()) || vacio(dto.getEtiqueta())
                || vacio(dto.getTextoBoton()) || vacio(dto.getEnlaceBoton())
                || vacio(dto.getMensajePromocional())) {
            return "Completa todos los textos del banner.";
        }
        if (dto.getTitulo().trim().length() > 140 || dto.getMensajePromocional().trim().length() > 180) {
            return "El título o el mensaje promocional es demasiado largo.";
        }
        String enlace = dto.getEnlaceBoton().trim();
        if (!enlace.startsWith("/") || enlace.startsWith("//")) {
            return "El enlace del botón debe ser una ruta interna, por ejemplo /catalogo.";
        }
        if (dto.getAlturaEscritorio() == null || dto.getAlturaEscritorio() < 320
                || dto.getAlturaEscritorio() > 520) {
            return "La altura de escritorio debe estar entre 320 y 520 px.";
        }
        if (dto.getAlturaMovil() == null || dto.getAlturaMovil() < 280 || dto.getAlturaMovil() > 440) {
            return "La altura móvil debe estar entre 280 y 440 px.";
        }
        if (!POSICIONES.contains(dto.getPosicionImagen())) {
            return "Selecciona una posición de imagen válida.";
        }
        return null;
    }

    private boolean vacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
