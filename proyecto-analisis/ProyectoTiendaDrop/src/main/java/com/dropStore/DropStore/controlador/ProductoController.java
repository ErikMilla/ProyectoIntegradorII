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
}