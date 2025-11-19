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
import com.dropStore.DropStore.Dto.ProductoConVariantesDTO; 
import com.dropStore.DropStore.Dto.ProductoRegistroDTO;    
import java.util.stream.Collectors; 
@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
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
    private FileStorageService fileStorageService; 
    private final ObjectMapper objectMapper = new ObjectMapper();   
    @PostMapping
    public ResponseEntity<?> registrarProducto(
        @RequestParam("file") MultipartFile file, 
        @RequestParam("data") String productData
    ) {
        ProductoConVariantesDTO dtoContenedor;        
        try {
            dtoContenedor = objectMapper.readValue(productData, ProductoConVariantesDTO.class);
            String fileUrl = fileStorageService.storeFile(file);
            dtoContenedor.getProducto().setFoto(fileUrl);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Datos del producto (JSON) no válidos: " + e.getMessage());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
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
            if (varianteDto.getMarcaId() == null) {
                return ResponseEntity.badRequest().body("Una de las variantes no tiene marca especificada.");
            }
            Optional<marca> marcaOpt = marcaRepository.findById(varianteDto.getMarcaId());
            if (marcaOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("La Marca (ID: " + varianteDto.getMarcaId() + ") especificada para una de las variantes no existe.");
            }           
            detalle_producto detalle = new detalle_producto();
            detalle.setGenero(varianteDto.getGenero());
            detalle.setTalla(varianteDto.getTalla());
            detalle.setStock(varianteDto.getStock());
            detalle.setColor(varianteDto.getColor());
            detalle.setProducto(productoGuardado);
            detalle.setMarca(marcaOpt.get());            
            detalleProductoRepository.save(detalle); 
        }

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
    public ResponseEntity<?> actualizarProducto(
            @PathVariable Long id,
            @RequestBody ProductoConVariantesDTO dtoContenedor
    ) {
        Optional<producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body("No se puede actualizar. Producto no encontrado con ID: " + id);
        }

        try {
            producto productoExistente = productoOpt.get();
            ProductoRegistroDTO productoDto = dtoContenedor.getProducto();
            List<DetalleRegistroDTO> variantesDto = dtoContenedor.getVariantes();

            if (productoDto.getCategoriaId() != null) {
                Optional<categoria> categoriaOpt = categoriaRepository.findById(productoDto.getCategoriaId());
                if (categoriaOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body("La Categoría (ID: " + productoDto.getCategoriaId() + ") no existe.");
                }
                productoExistente.setCategoria_id(categoriaOpt.get());
            } else {
                productoExistente.setCategoria_id(null);
            }
            productoExistente.setNombre(productoDto.getNombre());
            productoExistente.setModelo(productoDto.getModelo());
            productoExistente.setPrecio_compra(productoDto.getPrecioCompra());
            productoExistente.setPrcio_venta(productoDto.getPrecioVenta());
            productoExistente.setDescripcion(productoDto.getDescripcion());

            productoRepository.save(productoExistente); 

            List<detalle_producto> variantesAntiguas = detalleProductoRepository.findByProductoId(id);
            detalleProductoRepository.deleteAll(variantesAntiguas);

            for (DetalleRegistroDTO varianteDto : variantesDto) {
                if (varianteDto.getMarcaId() == null) {
                    return ResponseEntity.badRequest().body("Una de las variantes no tiene marca (ID nulo).");
                }              
                Optional<marca> marcaOpt = marcaRepository.findById(varianteDto.getMarcaId());
                if (marcaOpt.isEmpty()) {
                     return ResponseEntity.badRequest().body("La Marca (ID: " + varianteDto.getMarcaId() + ") no existe.");
                }
                detalle_producto detalleNuevo = new detalle_producto();
                detalleNuevo.setTalla(varianteDto.getTalla());
                detalleNuevo.setStock(varianteDto.getStock());
                detalleNuevo.setGenero(varianteDto.getGenero());
                detalleNuevo.setColor(varianteDto.getColor());
                detalleNuevo.setMarca(marcaOpt.get());
                detalleNuevo.setProducto(productoExistente);               
                detalleProductoRepository.save(detalleNuevo);
            }

            return ResponseEntity.ok(dtoContenedor); 

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error interno al actualizar: " + e.getMessage());
        }
    }
}