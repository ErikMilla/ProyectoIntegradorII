/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.Modelo;
import jakarta.persistence.*;

@Entity
@Table(name="producto")
public class producto {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;
    private String nombre;
    private String modelo;
    private String foto;
    private double precio_compra;
    private double prcio_venta;
    private String descripcion;
    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private categoria categoria_id;
    
    public producto() {
    }

    public String getNombre() {
        return nombre;
    }

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

    public double getPrecio_compra() {
        return precio_compra;
    }

    public void setPrecio_compra(double precio_compra) {
        this.precio_compra = precio_compra;
    }

    public double getPrcio_venta() {
        return prcio_venta;
    }

    public void setPrcio_venta(double prcio_venta) {
        this.prcio_venta = prcio_venta;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public categoria getCategoria_id() {
        return categoria_id;
    }

    public void setCategoria_id(categoria categoria_id) {
        this.categoria_id = categoria_id;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
    
    
}
