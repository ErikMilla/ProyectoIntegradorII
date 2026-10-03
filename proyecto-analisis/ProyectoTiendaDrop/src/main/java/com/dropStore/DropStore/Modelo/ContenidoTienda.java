package com.dropStore.DropStore.Modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "contenido_tienda")
public class ContenidoTienda {
    @Id
    private Long id;

    @Column(length = 80, nullable = false)
    private String etiqueta;

    @Column(length = 140, nullable = false)
    private String titulo;

    @Column(length = 50, nullable = false)
    private String textoBoton;

    @Column(length = 180, nullable = false)
    private String enlaceBoton;

    @Column(length = 180, nullable = false)
    private String mensajePromocional;

    @Column(length = 500)
    private String imagenBanner;

    @Column(nullable = false)
    private int alturaEscritorio;

    @Column(nullable = false)
    private int alturaMovil;

    @Column(length = 12, nullable = false)
    private String posicionImagen;

    public static ContenidoTienda predeterminado() {
        ContenidoTienda contenido = new ContenidoTienda();
        contenido.id = 1L;
        contenido.etiqueta = "Catálogo " + java.time.Year.now().getValue();
        contenido.titulo = "Streetwear que marca el paso.";
        contenido.textoBoton = "Comprar ahora";
        contenido.enlaceBoton = "/catalogo";
        contenido.mensajePromocional = "ENVÍOS GRATIS A TODO EL PERÚ";
        contenido.alturaEscritorio = 440;
        contenido.alturaMovil = 340;
        contenido.posicionImagen = "centro";
        return contenido;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEtiqueta() { return etiqueta; }
    public void setEtiqueta(String etiqueta) { this.etiqueta = etiqueta; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getTextoBoton() { return textoBoton; }
    public void setTextoBoton(String textoBoton) { this.textoBoton = textoBoton; }
    public String getEnlaceBoton() { return enlaceBoton; }
    public void setEnlaceBoton(String enlaceBoton) { this.enlaceBoton = enlaceBoton; }
    public String getMensajePromocional() { return mensajePromocional; }
    public void setMensajePromocional(String mensajePromocional) { this.mensajePromocional = mensajePromocional; }
    public String getImagenBanner() { return imagenBanner; }
    public void setImagenBanner(String imagenBanner) { this.imagenBanner = imagenBanner; }
    public int getAlturaEscritorio() { return alturaEscritorio; }
    public void setAlturaEscritorio(int alturaEscritorio) { this.alturaEscritorio = alturaEscritorio; }
    public int getAlturaMovil() { return alturaMovil; }
    public void setAlturaMovil(int alturaMovil) { this.alturaMovil = alturaMovil; }
    public String getPosicionImagen() { return posicionImagen; }
    public void setPosicionImagen(String posicionImagen) { this.posicionImagen = posicionImagen; }
}
