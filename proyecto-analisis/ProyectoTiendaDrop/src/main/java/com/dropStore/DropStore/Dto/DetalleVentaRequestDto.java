
package com.dropStore.DropStore.Dto;


public class DetalleVentaRequestDto {
       private Long detalleProductoId; // El ID de la variante (ej: talla 42)
    private int cantidad;
    private double precioUnitario; // El precio al que se vendió
    
        // Getters y Setters
    public Long getDetalleProductoId() { return detalleProductoId; }
    public void setDetalleProductoId(Long detalleProductoId) { this.detalleProductoId = detalleProductoId; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(double precioUnitario) { this.precioUnitario = precioUnitario; }
}
