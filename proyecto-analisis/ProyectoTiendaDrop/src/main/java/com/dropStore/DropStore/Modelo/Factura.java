
package com.dropStore.DropStore.Modelo;
import jakarta.persistence.*;
import java.util.Date;
@Entity
@Table(name="factura")
public class Factura {
   @Id
   @GeneratedValue(strategy= GenerationType.IDENTITY)
   private long id;
   private String tipo_pago;
   private double total;
   private double igv;
   private Date fecha;
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    @ManyToOne
    @JoinColumn(name = "venta_id")
    private Venta venta_id;

    public String getTipo_pago() {
        return tipo_pago;
    }

    public void setTipo_pago(String tipo_pago) {
        this.tipo_pago = tipo_pago;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public double getIgv() {
        return igv;
    }

    public void setIgv(double igv) {
        this.igv = igv;
    }

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Venta getVenta_id() {
        return venta_id;
    }

    public void setVenta_id(Venta venta_id) {
        this.venta_id = venta_id;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
    
    
}
