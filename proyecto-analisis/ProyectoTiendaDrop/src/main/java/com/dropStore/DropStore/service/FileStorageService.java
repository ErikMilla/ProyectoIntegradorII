
package com.dropStore.DropStore.service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.Map;

@Service
public class FileStorageService {
    // Directorio donde se guardarán las imágenes (Asegúrate de que exista en tu proyecto/sistema)
    private final Path fileStorageLocation = Paths.get("./uploads").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio para almacenar archivos.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Generar un nombre de archivo único para evitar colisiones
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("La imagen es obligatoria.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("La imagen supera el límite de 5 MB.");
        }
        Map<String, String> extensions = Map.of(
                "image/jpeg", ".jpg",
                "image/png", ".png",
                "image/webp", ".webp"
        );
        String extension = extensions.get(file.getContentType());
        if (extension == null) {
            throw new IllegalArgumentException("Formato no permitido. Usa JPG, PNG o WEBP.");
        }
        String fileName = UUID.randomUUID().toString() + extension;
        
        try {
            // Copiar el archivo al destino
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);
            
            // Devolver la URL pública que usará el frontend
            // NOTA: Esta URL depende de la configuración de tu ResourceHandler en Spring
            return "/uploads/" + fileName;
            
        } catch (IOException ex) {
            throw new RuntimeException("Error al guardar el archivo " + fileName, ex);
        }
    }
}
