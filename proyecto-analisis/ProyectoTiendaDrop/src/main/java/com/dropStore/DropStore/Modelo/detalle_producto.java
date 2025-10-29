/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.Modelo;
import jakarta.persistence.*;

@Entity
@Table(name="detalle_producto")
public class detalle_producto {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;
    private String genero;
    private double talla;
    private int stock;
    private String color;
    @ManyToOne
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;
    @ManyToOne
   @JoinColumn(name = "producto_id")
    private producto producto_id;
    @ManyToOne
   @JoinColumn(name ="marca_id")
     private marca marca_id;

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

    public Proveedor getProveedor() {
        return proveedor;
    }

    public void setProveedor(Proveedor proveedor) {
        this.proveedor = proveedor;
    }

    public producto getProducto_id() {
        return producto_id;
    }

    public void setProducto_id(producto producto_id) {
        this.producto_id = producto_id;
    }

    public marca getMarca_id() {
        return marca_id;
    }

    public void setMarca_id(marca marca_id) {
        this.marca_id = marca_id;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
    
    
    
}
