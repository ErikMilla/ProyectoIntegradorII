
package com.dropStore.DropStore.Dto;

import java.io.Serializable;

public class DetalleRegistroDTO implements Serializable {
    
    private Long id;
    private String genero;
    private double talla;
    private int stock;
    private String color;
    private Long marcaId; // Necesario para la relación ManyToOne
    // Solo de lectura: lo usa la ficha pública para mostrar "Adidas" en vez de un id.
    private String marcaNombre;
    
    // Getters y Setters
    public String getGenero() {
        return genero;
    }

    public void setGenero(String genero) {
        this.genero = genero;
    }

    public double getTalla() {
        return talla;
    }

    public void setTalla(double talla) {
        this.talla = talla;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getMarcaNombre() {
        return marcaNombre;
    }

    public void setMarcaNombre(String marcaNombre) {
        this.marcaNombre = marcaNombre;
    }

    public Long getMarcaId() {
        return marcaId;
    }

    public void setMarcaId(Long marcaId) {
        this.marcaId = marcaId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
    
}