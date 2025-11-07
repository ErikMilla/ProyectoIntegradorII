
package com.dropStore.DropStore.Dto;

import java.io.Serializable;

public class DetalleRegistroDTO implements Serializable {
    
    // Campos que estaban en detalle_producto
    private String genero;
    private double talla;
    private int stock;
    private String color;
    private Long marcaId; // Necesario para la relación ManyToOne
    
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

    public Long getMarcaId() {
        return marcaId;
    }

    public void setMarcaId(Long marcaId) {
        this.marcaId = marcaId;
    }
}