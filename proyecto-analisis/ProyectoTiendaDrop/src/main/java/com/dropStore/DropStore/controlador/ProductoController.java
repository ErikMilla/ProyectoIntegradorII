package com.dropStore.DropStore.controlador;
import com.dropStore.DropStore.Dto.DetalleRegistroDTO;
import com.dropStore.DropStore.Modelo.*;
import com.dropStore.DropStore.Repositorio.*;
import com.dropStore.DropStore.Dto.ProductoRegistroDTO;
import com.dropStore.DropStore.service.FileStorageService; 
import com.fasterxml.jackson.databind.ObjectMapper; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import com.dropStore.DropStore.Dto.ProductoConVariantesDTO; 
import com.dropStore.DropStore.Dto.ProductoRegistroDTO;    
import java.util.stream.Collectors; 
import org.springframework.transaction.annotation.Transactional;
import com.dropStore.DropStore.service.ReporteService;
import com.dropStore.DropStore.service.StockActualizadoEvent;
import org.springframework.context.ApplicationEventPublisher;
@RestController
@RequestMapping("/api/productos")
public class ProductoController {   
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private DetalleProductoRepository detalleProductoRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private MarcaRepository marcaRepository;
    @Autowired
    private DetalleVentaRepository detalleVentaRepository;
    @Autowired
    private FileStorageService fileStorageService; 
    @Autowired
    private ReporteService reporteService;
    @Autowired
    private ApplicationEventPublisher eventos;
    private final ObjectMapper objectMapper = new ObjectMapper();   
    @PostMapping
    @Transactional
    public ResponseEntity<?> registrarProducto(
        @RequestParam("file") MultipartFile file, 
        @RequestParam("data") String productData
    ) {
        ProductoConVariantesDTO dtoContenedor;        
        try {
            dtoContenedor = objectMapper.readValue(productData, ProductoConVariantesDTO.class);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Datos del producto (JSON) no válidos: " + e.getMessage());
        }
        if (dtoContenedor == null || dtoContenedor.getProducto() == null) {
            return ResponseEntity.badRequest().body("Los datos del producto son obligatorios.");
        }
        ProductoRegistroDTO productoDto = dtoContenedor.getProducto();
        if (productoDto.getCategoriaId() == null) {
            return ResponseEntity.badRequest().body("Debe especificar una categoría.");
        }
        Optional<categoria> categoriaOpt = categoriaRepository.findById(productoDto.getCategoriaId());
        if (categoriaOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("La Categoría especificada no existe.");
        }
        if (dtoContenedor.getVariantes() == null || dtoContenedor.getVariantes().isEmpty()) {
            return ResponseEntity.badRequest().body("Debe registrar al menos una talla/variante para este producto.");
        }
        Map<Long, marca> marcas = new LinkedHashMap<>();
        for (DetalleRegistroDTO varianteDto : dtoContenedor.getVariantes()) {
            if (varianteDto.getMarcaId() == null || varianteDto.getStock() < 0 || varianteDto.getTalla() <= 0) {
                return ResponseEntity.badRequest().body("Cada variante necesita marca, talla y stock válidos.");
            }
            Optional<marca> marcaOpt = marcaRepository.findById(varianteDto.getMarcaId());
            if (marcaOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("La marca especificada no existe.");
            }
            marcas.put(varianteDto.getMarcaId(), marcaOpt.get());
        }
        try {
            productoDto.setFoto(fileStorageService.storeFile(file));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
        }
        producto nuevoProducto = new producto();
        nuevoProducto.setNombre(productoDto.getNombre());
        nuevoProducto.setModelo(productoDto.getModelo());
        nuevoProducto.setFoto(productoDto.getFoto()); // URL persistente
        nuevoProducto.setPrecio_compra(productoDto.getPrecioCompra());
        nuevoProducto.setPrcio_venta(productoDto.getPrecioVenta());
        nuevoProducto.setDescripcion(productoDto.getDescripcion());
        nuevoProducto.setCategoria_id(categoriaOpt.get());

        producto productoGuardado = productoRepository.save(nuevoProducto);
        for (DetalleRegistroDTO varianteDto : dtoContenedor.getVariantes()) {
            detalle_producto detalle = new detalle_producto();
            detalle.setGenero(varianteDto.getGenero());
            detalle.setTalla(varianteDto.getTalla());
            detalle.setStock(varianteDto.getStock());
            detalle.setColor(varianteDto.getColor());
            detalle.setProducto(productoGuardado);
            detalle.setMarca(marcas.get(varianteDto.getMarcaId()));
            detalleProductoRepository.save(detalle); 
        }

        eventos.publishEvent(new StockActualizadoEvent("producto-creado"));
        return ResponseEntity.status(HttpStatus.CREATED).body(productoGuardado);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductoParaEditar(@PathVariable Long id) {
        Optional<producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body("Producto no encontrado con ID: " + id);
        }
        producto productoMaestro = productoOpt.get(); 
        List<detalle_producto> variantes = detalleProductoRepository.findByProductoId(id);
        ProductoRegistroDTO productoDto = new ProductoRegistroDTO();
        productoDto.setId(productoMaestro.getId()); // 👈 ID del producto
        productoDto.setNombre(productoMaestro.getNombre());
        productoDto.setModelo(productoMaestro.getModelo());
        productoDto.setFoto(productoMaestro.getFoto());
        productoDto.setPrecioCompra(productoMaestro.getPrecio_compra());
        productoDto.setPrecioVenta(productoMaestro.getPrcio_venta());
        productoDto.setDescripcion(productoMaestro.getDescripcion());
        if (productoMaestro.getCategoria_id() != null) {
            productoDto.setCategoriaId(productoMaestro.getCategoria_id().getId());
        } else {
            productoDto.setCategoriaId(null); 
        }

        List<DetalleRegistroDTO> variantesDto = variantes.stream().map(v -> {
            DetalleRegistroDTO dto = new DetalleRegistroDTO();
            dto.setId(v.getId()); 
            dto.setTalla(v.getTalla());
            dto.setStock(v.getStock());
            dto.setGenero(v.getGenero());
            dto.setColor(v.getColor());
            if (v.getMarca() != null) {
                dto.setMarcaId(v.getMarca().getId());
                dto.setMarcaNombre(v.getMarca().getNombre());
            } else {
                dto.setMarcaId(null); 
            }
            return dto;
        }).collect(Collectors.toList()); 
        ProductoConVariantesDTO responseDto = new ProductoConVariantesDTO();
        responseDto.setProducto(productoDto);
        responseDto.setVariantes(variantesDto);
        return ResponseEntity.ok(responseDto);
    }   
    @GetMapping 
    public ResponseEntity<List<detalle_producto>> getProductos(
        @RequestParam(required = false) String genero,
        @RequestParam(required = false) String marca // Parametro de Marca
    ) {
        List<detalle_producto> detalles;
        
        String generoFiltro = (genero != null) ? genero.trim() : null;
        String marcaFiltro = (marca != null) ? marca.trim() : null;
        
        boolean hasGenero = generoFiltro != null && !generoFiltro.isEmpty();
        boolean hasMarca = marcaFiltro != null && !marcaFiltro.isEmpty();
        
        if (hasGenero && hasMarca) {
            detalles = detalleProductoRepository.findByGeneroAndMarca_nombre(generoFiltro, marcaFiltro);
        } else if (hasGenero) {
            detalles = detalleProductoRepository.findByGenero(generoFiltro);
        } else if (hasMarca) {
            detalles = detalleProductoRepository.findByMarca_nombre(marcaFiltro);
        } else {
            detalles = detalleProductoRepository.findAll();
        }

        return new ResponseEntity<>(detalles, HttpStatus.OK); 
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> actualizarProducto(
            @PathVariable Long id,
            @RequestBody ProductoConVariantesDTO dtoContenedor
    ) {
        Optional<producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se puede actualizar. Producto no encontrado con ID: " + id);
        }
        if (dtoContenedor == null || dtoContenedor.getProducto() == null
                || dtoContenedor.getVariantes() == null || dtoContenedor.getVariantes().isEmpty()) {
            return ResponseEntity.badRequest().body("El producto debe incluir al menos una variante.");
        }

        producto productoExistente = productoOpt.get();
        ProductoRegistroDTO productoDto = dtoContenedor.getProducto();
        List<DetalleRegistroDTO> variantesDto = dtoContenedor.getVariantes();
        if (productoDto.getCategoriaId() == null) {
            return ResponseEntity.badRequest().body("La categoría es obligatoria.");
        }
        Optional<categoria> categoriaOpt = categoriaRepository.findById(productoDto.getCategoriaId());
        if (categoriaOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("La categoría especificada no existe.");
        }

        List<detalle_producto> existentes = detalleProductoRepository.findByProductoId(id);
        Map<Long, detalle_producto> existentesPorId = existentes.stream()
                .collect(Collectors.toMap(detalle_producto::getId, variante -> variante));
        Map<Long, marca> marcasPorId = new LinkedHashMap<>();

        for (DetalleRegistroDTO varianteDto : variantesDto) {
            if (varianteDto.getMarcaId() == null || varianteDto.getStock() < 0 || varianteDto.getTalla() <= 0) {
                return ResponseEntity.badRequest().body("Cada variante necesita marca, talla y stock válidos.");
            }
            Optional<marca> marcaOpt = marcaRepository.findById(varianteDto.getMarcaId());
            if (marcaOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("La marca especificada no existe.");
            }
            marcasPorId.put(varianteDto.getMarcaId(), marcaOpt.get());
            if (varianteDto.getId() != null && !existentesPorId.containsKey(varianteDto.getId())) {
                return ResponseEntity.badRequest().body("Una variante no pertenece a este producto.");
            }
        }

        productoExistente.setCategoria_id(categoriaOpt.get());
        productoExistente.setNombre(productoDto.getNombre());
        productoExistente.setModelo(productoDto.getModelo());
        if (productoDto.getFoto() != null && !productoDto.getFoto().isBlank()) {
            productoExistente.setFoto(productoDto.getFoto());
        }
        productoExistente.setPrecio_compra(productoDto.getPrecioCompra());
        productoExistente.setPrcio_venta(productoDto.getPrecioVenta());
        productoExistente.setDescripcion(productoDto.getDescripcion());
        productoRepository.save(productoExistente);

        Set<Long> conservadas = new HashSet<>();
        for (DetalleRegistroDTO varianteDto : variantesDto) {
            detalle_producto variante = varianteDto.getId() == null
                    ? new detalle_producto()
                    : existentesPorId.get(varianteDto.getId());
            variante.setTalla(varianteDto.getTalla());
            variante.setStock(varianteDto.getStock());
            variante.setGenero(varianteDto.getGenero());
            variante.setColor(varianteDto.getColor());
            variante.setMarca(marcasPorId.get(varianteDto.getMarcaId()));
            variante.setProducto(productoExistente);
            detalle_producto guardada = detalleProductoRepository.save(variante);
            conservadas.add(guardada.getId());
        }

        for (detalle_producto variante : existentes) {
            if (conservadas.contains(variante.getId())) continue;
            if (detalleVentaRepository.existsByDetalleProductoId(variante.getId())) {
                variante.setStock(0);
                detalleProductoRepository.save(variante);
            } else {
                detalleProductoRepository.delete(variante);
            }
        }

        eventos.publishEvent(new StockActualizadoEvent("producto-actualizado"));
        return ResponseEntity.ok(dtoContenedor);
    }

    @GetMapping("/mas-vendidos")
    public ResponseEntity<List<Map<String, Object>>> getMasVendidos() {
        return ResponseEntity.ok(reporteService.productosMasVendidos(8));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        Optional<producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Producto no encontrado con ID: " + id);
        }

        List<detalle_producto> variantes = detalleProductoRepository.findByProductoId(id);
        boolean tieneVentas = variantes.stream()
                .anyMatch(variante -> detalleVentaRepository.existsByDetalleProductoId(variante.getId()));
        if (tieneVentas) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("El producto tiene ventas registradas. Déjalo sin stock para conservar el historial.");
        }
        detalleProductoRepository.deleteAll(variantes);
        productoRepository.delete(productoOpt.get());
        eventos.publishEvent(new StockActualizadoEvent("producto-eliminado"));
        return ResponseEntity.noContent().build();
    }
}
