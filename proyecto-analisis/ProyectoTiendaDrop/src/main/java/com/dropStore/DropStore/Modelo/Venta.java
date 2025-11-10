package com.dropStore.DropStore.Modelo;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name="ventas")
public class Venta {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;
    
    private Date fecha;
    private String tipo_venta;
    
    // --- CAMPOS NUEVOS AÑADIDOS ---
    
    // Mapeamos el campo 'subtotal' de Java a la columna 'subtotal' de SQL
    @Column(name = "subtotal")
    private Double subtotal;
    
    // Mapeamos el campo 'igv' de Java a la columna 'igv' de SQL
    @Column(name = "igv")
    private Double igv;
    
    // Mapeamos el campo 'costoEnvio' (camelCase) a la columna 'costo_envio' (snake_case)
    @Column(name = "costo_envio")
    private Double costoEnvio;
    
    // --- FIN DE CAMPOS NUEVOS ---
    
    private Double total;
    private String metodo_pago;
    
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    // --- Getters y Setters existentes ---
    
    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public String getTipo_venta() {
        return tipo_venta;
    }

    public void setTipo_venta(String tipo_venta) {
        this.tipo_venta = tipo_venta;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public String getMetodo_pago() {
        return metodo_pago;
    }

    public void setMetodo_pago(String metodo_pago) {
        this.metodo_pago = metodo_pago;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
    
    // --- Getters y Setters NUEVOS ---

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public Double getIgv() {
        return igv;
    }

    public void setIgv(Double igv) {
        this.igv = igv;
    }

    public Double getCostoEnvio() {
        return costoEnvio;
    }

    public void setCostoEnvio(Double costoEnvio) {
        this.costoEnvio = costoEnvio;
    }
}