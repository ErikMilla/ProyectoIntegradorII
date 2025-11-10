package com.dropStore.DropStore.Modelo;

import jakarta.persistence.*;

@Entity
@Table(name="detalle_venta")
public class DetalleVenta {

    @Id     
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;
    
    private int cantidad;
    private double costo;
    private double envio;   
    
    @ManyToOne
    @JoinColumn(name = "venta_id") // Esto se queda igual, está correcto
    private Venta venta_id;
    
    // --- ¡ESTE ES EL CAMBIO IMPORTANTE! ---
    
    @ManyToOne
    @JoinColumn(name = "detalle_producto_id") // 1. Apuntamos a la NUEVA columna de la BD
    private detalle_producto detalle_producto; // 2. Apuntamos a la Entidad "DetalleProducto"
    
    // --- Fin del Cambio ---


    // --- Getters y Setters ---
    
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public double getCosto() {
        return costo;
    }

    public void setCosto(double costo) {
        this.costo = costo;
    }

    public double getEnvio() {
        return envio;
    }

    public void setEnvio(double envio) {
        this.envio = envio;
    }

    public Venta getVenta_id() {
        return venta_id;
    }

    public void setVenta_id(Venta venta_id) {
        this.venta_id = venta_id;
    }

    // 3. Getters y Setters actualizados para la nueva relación
    public detalle_producto getDetalle_producto() {
        return detalle_producto;
    }

    public void setDetalle_producto(detalle_producto detalle_producto) {
        this.detalle_producto = detalle_producto;
    }
}