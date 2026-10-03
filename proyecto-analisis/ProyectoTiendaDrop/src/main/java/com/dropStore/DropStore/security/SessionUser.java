package com.dropStore.DropStore.security;

import java.io.Serializable;

/** Identidad mínima guardada en la sesión; nunca contiene la contraseña. */
public record SessionUser(Long id, String correo, String rol) implements Serializable {
}
