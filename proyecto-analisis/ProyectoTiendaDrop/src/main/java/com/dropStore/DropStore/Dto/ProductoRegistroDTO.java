
package com.dropStore.DropStore.Dto;

public class ProductoRegistroDTO { // Renombrado sugerido: ProductoMaestroDTO
    // Campos de la entidad 'producto'
    private String nombre;
    private String modelo;
    private String foto; // URL o nombre de archivo
    private double precioCompra;
    private double precioVenta;
    private String descripcion;
    private Long categoriaId; // ID de la Categoría seleccionada
    
    // CAMPOS DE VARIANTE (genero, talla, stock, color, marcaId) FUERON ELIMINADOS
    
    // Getters y Setters
    public String getNombre() {
        return nombre;
    }
    // ... (El resto de getters y setters para nombre, modelo, foto, precioCompra, precioVenta, descripcion, categoriaId)
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getFoto() {
        return foto;
    }

    public void setFoto(String foto) {
        this.foto = foto;
    }

    public double getPrecioCompra() {
        return precioCompra;
    }

    public void setPrecioCompra(double precioCompra) {
        this.precioCompra = precioCompra;
    }

    public double getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(double precioVenta) {
        this.precioVenta = precioVenta;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }
}