package com.dropStore.DropStore.controlador;
import com.dropStore.DropStore.Modelo.*;
import com.dropStore.DropStore.Repositorio.*;
import com.dropStore.DropStore.Dto.ProductoRegistroDTO;
import com.dropStore.DropStore.service.FileStorageService; // NUEVA IMPORTACIÓN
import com.fasterxml.jackson.databind.ObjectMapper; // NUEVA IMPORTACIÓN (para JSON)
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

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
    
    // Declarar ObjectMapper como campo de clase (fuera de cualquier método)
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // NOTA: Se eliminó el @RequestBody ProductoRegistroDTO dto de la firma
    @PostMapping
    public ResponseEntity<?> registrarProducto(
        @RequestParam("file") MultipartFile file, 
        @RequestParam("data") String productData
    ) {
        ProductoRegistroDTO dto; // <--- Declaración LIMPIA (SIN 'ProductoRegistroDTO' en la firma)
        
        try {
            // 1. Convertir el JSON String a DTO
            dto = objectMapper.readValue(productData, ProductoRegistroDTO.class);
            
            // 2. Guardar el archivo y obtener la URL
            String fileUrl = fileStorageService.storeFile(file);
            dto.setFoto(fileUrl); // Asignar la URL generada al DTO
            
        } catch (IOException e) {
            // Manejar error de JSON (productData)
            return ResponseEntity.badRequest().body("Datos del producto (JSON) no válidos: " + e.getMessage());
        } catch (RuntimeException ex) {
             // Manejar error de subida de archivo
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
        }
        
        // 3. Verificar Categoría y Marca
        Optional<categoria> categoriaOpt = categoriaRepository.findById(dto.getCategoriaId());
        Optional<marca> marcaOpt = marcaRepository.findById(dto.getMarcaId());

        if (categoriaOpt.isEmpty() || marcaOpt.isEmpty()) {
            // Si la foto ya se subió, deberías considerar eliminarla aquí.
            return ResponseEntity.badRequest().body("La Categoría o Marca especificada no existe.");
        }

        // 4. Crear la entidad Producto
        producto nuevoProducto = new producto();
        nuevoProducto.setNombre(dto.getNombre());
        nuevoProducto.setModelo(dto.getModelo());
        nuevoProducto.setFoto(dto.getFoto()); // URL persistente
        nuevoProducto.setPrecio_compra(dto.getPrecioCompra());
        nuevoProducto.setPrcio_venta(dto.getPrecioVenta());
        nuevoProducto.setDescripcion(dto.getDescripcion());
        nuevoProducto.setCategoria_id(categoriaOpt.get());
        
        producto productoGuardado = productoRepository.save(nuevoProducto);

        // 5. Crear la entidad DetalleProducto
        detalle_producto detalle = new detalle_producto();
        detalle.setGenero(dto.getGenero());
        detalle.setTalla(dto.getTalla());
        detalle.setStock(dto.getStock());
        detalle.setColor(dto.getColor());
        detalle.setProducto_id(productoGuardado);
        detalle.setMarca_id(marcaOpt.get());
        
        detalleProductoRepository.save(detalle);

        return ResponseEntity.status(HttpStatus.CREATED).body(productoGuardado);
    }
    
    // GET: Obtener todos los productos (se puede expandir para incluir detalles)
    @GetMapping
    public List<producto> getAllProductos() {
        return productoRepository.findAll();
    }
}