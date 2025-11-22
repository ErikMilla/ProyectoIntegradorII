
package com.dropStore.DropStore.Dto;
import java.util.List;
public class ProductoConVariantesDTO {
    
    // El objeto Producto Maestro (ProductoRegistroDTO modificado o renombrado)
    private ProductoRegistroDTO producto; // O usa ProductoMaestroDTO si lo renombraste
    
    // El array de variantes (Lista de DetalleRegistroDTO)
    private List<DetalleRegistroDTO> variantes;

    // Getters y Setters
    public ProductoRegistroDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductoRegistroDTO producto) {
        this.producto = producto;
    }

    public List<DetalleRegistroDTO> getVariantes() {
        return variantes;
    }

    public void setVariantes(List<DetalleRegistroDTO> variantes) {
        this.variantes = variantes;
    }
}
