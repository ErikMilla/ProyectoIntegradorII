package com.dropStore.DropStore.Modelo;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "usuario")
public class Usuario {
    
    @Id    
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Cambiar de long a Long
    
    private String dni; // CAMBIAR de int a String
    private String nombre;
    private String apellido;
    
    @Column(unique = true, nullable = false)
    private String correo;
    
    private String telefono; // CAMBIAR de int a String
    private String direccion;
    private String rol; 
    private String contraseña;
    
    @Transient // AGREGAR esto para que NO se guarde en BD
    private String confircontraseña;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date fechacreacion;

    // Constructor vacío (requerido por JPA)
    public Usuario() {}

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getContraseña() {
        return contraseña;
    }

    public void setContraseña(String contraseña) {
        this.contraseña = contraseña;
    }

    public String getConfircontraseña() {
        return confircontraseña;
    }

    public void setConfircontraseña(String confircontraseña) {
        this.confircontraseña = confircontraseña;
    }

    public Date getFechacreacion() {
        return fechacreacion;
    }

    public void setFechacreacion(Date fechacreacion) {
        this.fechacreacion = fechacreacion;
    }
}