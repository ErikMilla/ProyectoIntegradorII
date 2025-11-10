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
import java.util.stream.Collectors; // 👈 Asegúrate de que este import exista

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
    
    // Declarar ObjectMapper como campo de clase
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @PostMapping
    public ResponseEntity<?> registrarProducto(
        @RequestParam("file") MultipartFile file, 
        @RequestParam("data") String productData
    ) {
       // 🚨 CAMBIO CLAVE: Usamos el DTO contenedor para mapear la entrada anidada de React
        ProductoConVariantesDTO dtoContenedor; 
        
        try {
            // 1. Convertir el JSON String a DTO Contenedor
            dtoContenedor = objectMapper.readValue(productData, ProductoConVariantesDTO.class);
            
            // 2. Guardar el archivo y obtener la URL (solo para el Producto Maestro)
            String fileUrl = fileStorageService.storeFile(file);
            dtoContenedor.getProducto().setFoto(fileUrl); // Asignamos la URL al Producto Maestro DTO
            
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Datos del producto (JSON) no válidos: " + e.getMessage());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
        }

        // Obtener el DTO del producto maestro para simplificar el código
        ProductoRegistroDTO productoDto = dtoContenedor.getProducto();
        
        // 3. Validación y Búsqueda de Entidades Maestras (Solo Categoría)
        // 👇 --- CORRECCIÓN (PREVENCIÓN): Chequeo de nulidad en POST --- 👇
        if (productoDto.getCategoriaId() == null) {
            return ResponseEntity.badRequest().body("Debe especificar una categoría.");
        }
        Optional<categoria> categoriaOpt = categoriaRepository.findById(productoDto.getCategoriaId());

        if (categoriaOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("La Categoría especificada no existe.");
        }
        
        // ** Validamos que haya al menos una variante **
        if (dtoContenedor.getVariantes() == null || dtoContenedor.getVariantes().isEmpty()) {
            return ResponseEntity.badRequest().body("Debe registrar al menos una talla/variante para este producto.");
        }

        // 4. CREAR Y GUARDAR EL PRODUCTO MAESTRO (solo un registro)
        producto nuevoProducto = new producto();
        nuevoProducto.setNombre(productoDto.getNombre());
        nuevoProducto.setModelo(productoDto.getModelo());
        nuevoProducto.setFoto(productoDto.getFoto()); // URL persistente
        nuevoProducto.setPrecio_compra(productoDto.getPrecioCompra());
        nuevoProducto.setPrcio_venta(productoDto.getPrecioVenta());
        nuevoProducto.setDescripcion(productoDto.getDescripcion());
        nuevoProducto.setCategoria_id(categoriaOpt.get());
        
        // Guardamos el producto maestro (genera el ID que usaremos para todas las variantes)
        producto productoGuardado = productoRepository.save(nuevoProducto);

        // 5. CREAR Y GUARDAR LAS VARIANTES (múltiples registros en detalle_producto)
        for (DetalleRegistroDTO varianteDto : dtoContenedor.getVariantes()) {
            
            // 👇 --- CORRECCIÓN (PREVENCIÓN): Chequeo de nulidad en POST --- 👇
            if (varianteDto.getMarcaId() == null) {
                return ResponseEntity.badRequest().body("Una de las variantes no tiene marca especificada.");
            }
            // Buscar Marca por ID (La marca puede ser diferente para cada variante/color)
            Optional<marca> marcaOpt = marcaRepository.findById(varianteDto.getMarcaId());
            if (marcaOpt.isEmpty()) {
                // Podrías registrar el producto maestro y omitir esta variante, o fallar
                return ResponseEntity.badRequest().body("La Marca (ID: " + varianteDto.getMarcaId() + ") especificada para una de las variantes no existe.");
            }
            
            detalle_producto detalle = new detalle_producto();
            
            // Campos de la variante
            detalle.setGenero(varianteDto.getGenero());
            detalle.setTalla(varianteDto.getTalla());
            detalle.setStock(varianteDto.getStock());
            detalle.setColor(varianteDto.getColor());
            
            // Relaciones
            detalle.setProducto(productoGuardado); // Enlazamos al producto maestro recién guardado
            detalle.setMarca(marcaOpt.get());
            
            detalleProductoRepository.save(detalle); // Guardamos cada variante individualmente
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(productoGuardado);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductoParaEditar(@PathVariable Long id) {
        
        // 1. Buscar el Producto Maestro por su ID
        Optional<producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body("Producto no encontrado con ID: " + id);
        }
        producto productoMaestro = productoOpt.get(); // Entidad 'producto'

        // 2. Buscar TODAS sus variantes (detalles)
        List<detalle_producto> variantes = detalleProductoRepository.findByProductoId(id);

        // 3. Convertir las Entidades a los DTOs que el frontend (ProductForm) espera
        
        // Convertir la entidad 'producto' al DTO
        ProductoRegistroDTO productoDto = new ProductoRegistroDTO();
        productoDto.setId(productoMaestro.getId()); // 👈 ID del producto
        productoDto.setNombre(productoMaestro.getNombre());
        productoDto.setModelo(productoMaestro.getModelo());
        productoDto.setFoto(productoMaestro.getFoto());
        productoDto.setPrecioCompra(productoMaestro.getPrecio_compra());
        productoDto.setPrecioVenta(productoMaestro.getPrcio_venta());
        productoDto.setDescripcion(productoMaestro.getDescripcion());
        
        // 👇 --- CORRECCIÓN 1: Aquí estaba el error de Nulidad de Categoría --- 👇
        if (productoMaestro.getCategoria_id() != null) {
            productoDto.setCategoriaId(productoMaestro.getCategoria_id().getId());
        } else {
            productoDto.setCategoriaId(null); // Si es null, mandamos null
        }
        // 👆 --- FIN DE LA CORRECCIÓN 1 --- 👆
        
        // Convertir la LISTA de 'detalle_producto' (entidades) a 'List<DetalleRegistroDTO>'
        List<DetalleRegistroDTO> variantesDto = variantes.stream().map(v -> {
            DetalleRegistroDTO dto = new DetalleRegistroDTO();
            dto.setId(v.getId()); // 👈 ID de la variante (detalle)
            dto.setTalla(v.getTalla());
            dto.setStock(v.getStock());
            dto.setGenero(v.getGenero());
            dto.setColor(v.getColor());
            
            // 👇 --- CORRECCIÓN 2: Aquí estaba el error de Nulidad de Marca --- 👇
            if (v.getMarca() != null) {
                dto.setMarcaId(v.getMarca().getId());
            } else {
                dto.setMarcaId(null); // Si es null, mandamos null
            }
            // 👆 --- FIN DE LA CORRECCIÓN 2 --- 👆
            return dto;
        }).collect(Collectors.toList()); // Asegúrate de importar java.util.stream.Collectors

        // 4. Ensamblar el DTO contenedor final (el que usa tu 'ProductForm')
        ProductoConVariantesDTO responseDto = new ProductoConVariantesDTO();
        responseDto.setProducto(productoDto);
        responseDto.setVariantes(variantesDto);
        
        // 5. Devolver la respuesta
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
            // 1. Filtrar por GÉNERO Y MARCA
            detalles = detalleProductoRepository.findByGeneroAndMarca_nombre(generoFiltro, marcaFiltro);
        } else if (hasGenero) {
            // 2. Filtrar solo por GÉNERO
            detalles = detalleProductoRepository.findByGenero(generoFiltro);
        } else if (hasMarca) {
            // 3. Filtrar solo por MARCA
            detalles = detalleProductoRepository.findByMarca_nombre(marcaFiltro);
        } else {
            // 4. Sin Filtros (Todos)
            detalles = detalleProductoRepository.findAll();
        }

        return new ResponseEntity<>(detalles, HttpStatus.OK); 
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(
            @PathVariable Long id,
            @RequestBody ProductoConVariantesDTO dtoContenedor
    ) {
        
        // 1. Validar que el ID del producto maestro exista
        Optional<producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body("No se puede actualizar. Producto no encontrado con ID: " + id);
        }

        try {
            // 2. Extraer datos
            producto productoExistente = productoOpt.get();
            ProductoRegistroDTO productoDto = dtoContenedor.getProducto();
            List<DetalleRegistroDTO> variantesDto = dtoContenedor.getVariantes();

            // 3. Buscar Entidades (Categoría)
            // 👇 --- CORRECCIÓN 3: Chequeo de nulidad al Guardar Categoría --- 👇
            if (productoDto.getCategoriaId() != null) {
                Optional<categoria> categoriaOpt = categoriaRepository.findById(productoDto.getCategoriaId());
                if (categoriaOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body("La Categoría (ID: " + productoDto.getCategoriaId() + ") no existe.");
                }
                productoExistente.setCategoria_id(categoriaOpt.get());
            } else {
                // Permitir que la categoría sea nula si el frontend envía null
                productoExistente.setCategoria_id(null);
            }
            // 👆 --- FIN DE LA CORRECCIÓN 3 --- 👆

            // 4. Actualizar el PRODUCTO MAESTRO
            productoExistente.setNombre(productoDto.getNombre());
            productoExistente.setModelo(productoDto.getModelo());
            productoExistente.setPrecio_compra(productoDto.getPrecioCompra());
            productoExistente.setPrcio_venta(productoDto.getPrecioVenta());
            productoExistente.setDescripcion(productoDto.getDescripcion());
            // No actualizamos la foto, usamos la que ya tiene

            productoRepository.save(productoExistente); // Guardar cambios del maestro

            // 5. Actualizar, Crear o Borrar VARIANTES
            // (Enfoque simple: Borrar todas las variantes antiguas
            // y recrearlas con los datos que vienen del frontend)
            
            // 5a. Borrar variantes antiguas de este producto
            List<detalle_producto> variantesAntiguas = detalleProductoRepository.findByProductoId(id);
            detalleProductoRepository.deleteAll(variantesAntiguas);

            // 5b. Crear las nuevas variantes (las que el usuario envió)
            for (DetalleRegistroDTO varianteDto : variantesDto) {
                
                // 👇 --- CORRECCIÓN 4: Chequeo de nulidad al Guardar Marca --- 👇
                if (varianteDto.getMarcaId() == null) {
                    return ResponseEntity.badRequest().body("Una de las variantes no tiene marca (ID nulo).");
                }
                
                Optional<marca> marcaOpt = marcaRepository.findById(varianteDto.getMarcaId());
                if (marcaOpt.isEmpty()) {
                     return ResponseEntity.badRequest().body("La Marca (ID: " + varianteDto.getMarcaId() + ") no existe.");
                }
                // 👆 --- FIN DE LA CORRECCIÓN 4 --- 👆

                detalle_producto detalleNuevo = new detalle_producto();
                detalleNuevo.setTalla(varianteDto.getTalla());
                detalleNuevo.setStock(varianteDto.getStock());
                detalleNuevo.setGenero(varianteDto.getGenero());
                detalleNuevo.setColor(varianteDto.getColor());
                detalleNuevo.setMarca(marcaOpt.get());
                detalleNuevo.setProducto(productoExistente); // Relacionar al maestro
                
                detalleProductoRepository.save(detalleNuevo);
            }

            return ResponseEntity.ok(dtoContenedor); // Devolver el objeto actualizado

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error interno al actualizar: " + e.getMessage());
        }
    }
}