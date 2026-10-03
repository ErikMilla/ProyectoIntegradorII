package com.dropStore.DropStore.Modelo;

import jakarta.persistence.*;

import java.util.Date;

/**
 * Comentario y calificación que un cliente deja sobre un producto.
 *
 * La reseña va contra el PRODUCTO (el modelo), no contra una talla concreta:
 * a quien lee le interesa la opinión de la zapatilla, no la del 42.
 */
@Entity
@Table(name = "resena")
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id")
    private producto producto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    /** De 1 a 5 estrellas. */
    @Column(nullable = false)
    private int calificacion;

    @Column(length = 1000)
    private String comentario;

    @Temporal(TemporalType.TIMESTAMP)
    private Date fecha;

    public Resena() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public producto getProducto() {
        return producto;
    }

    public void setProducto(producto producto) {
        this.producto = producto;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public int getCalificacion() {
        return calificacion;
    }

    public void setCalificacion(int calificacion) {
        this.calificacion = calificacion;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }
}
