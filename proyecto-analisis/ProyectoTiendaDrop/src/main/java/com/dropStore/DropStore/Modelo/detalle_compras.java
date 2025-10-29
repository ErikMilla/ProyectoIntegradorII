/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.dropStore.DropStore.Modelo;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "detalle_compra")
public class detalle_compras {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long id;
  private int cantidad;
  private double precio_compra;
  private String observacion;
  private Date fecha_compra;
  private Date fecha_llegada;
  @ManyToOne
  @JoinColumn(name ="compras_id")
  private compras compras_id;
  
  

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public double getPrecio_compra() {
        return precio_compra;
    }

    public void setPrecio_compra(double precio_compra) {
        this.precio_compra = precio_compra;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public Date getFecha_compra() {
        return fecha_compra;
    }

    public void setFecha_compra(Date fecha_compra) {
        this.fecha_compra = fecha_compra;
    }

    public Date getFecha_llegada() {
        return fecha_llegada;
    }

    public void setFecha_llegada(Date fecha_llegada) {
        this.fecha_llegada = fecha_llegada;
    }

    public compras getCompras_id() {
        return compras_id;
    }

    public void setCompras_id(compras compras_id) {
        this.compras_id = compras_id;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
  
  
}
