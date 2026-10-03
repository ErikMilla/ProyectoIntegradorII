package com.dropStore.DropStore.service;

import java.io.Serializable;

public record PendingRegistration(
        Long usuarioExistenteId,
        String dni,
        String nombre,
        String apellido,
        String correo,
        String telefono,
        String direccion,
        String contrasenaCifrada) implements Serializable {
}
