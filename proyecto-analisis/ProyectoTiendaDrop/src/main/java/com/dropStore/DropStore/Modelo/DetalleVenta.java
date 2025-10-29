
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
    @JoinColumn(name = "venta_id")
    private Venta venta_id;
    @ManyToOne
    @JoinColumn(name = "producto_id")
    private producto producto_id;

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

    public producto getProducto_id() {
        return producto_id;
    }

    public void setProducto_id(producto producto_id) {
        this.producto_id = producto_id;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
    
    
        
}
