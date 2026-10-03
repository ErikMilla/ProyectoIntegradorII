package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.Usuario;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Centraliza el manejo de contrasenas.
 *
 * El sistema nacio guardando las contrasenas en texto plano. Para no dejar
 * fuera a los usuarios que ya existen en la base, aqui se aceptan los dos
 * formatos: si la contrasena guardada todavia esta en texto plano se compara
 * directamente y se marca para migrarla a BCrypt en ese mismo inicio de sesion.
 */
@Service
public class PasswordService {

    /** Las contrasenas cifradas con BCrypt siempre empiezan con $2a, $2b o $2y. */
    private static final String PREFIJO_BCRYPT = "$2";

    private final PasswordEncoder encoder;

    public PasswordService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public String cifrar(String contrasenaPlana) {
        return encoder.encode(contrasenaPlana);
    }

    public boolean estaCifrada(String contrasenaGuardada) {
        return contrasenaGuardada != null && contrasenaGuardada.startsWith(PREFIJO_BCRYPT);
    }

    /**
     * @return true si la contrasena ingresada corresponde al usuario.
     *         false si no coincide o si el usuario no tiene contrasena asignada.
     */
    public boolean coincide(Usuario usuario, String contrasenaIngresada) {
        String guardada = usuario.getContraseña();
        if (guardada == null || guardada.isBlank() || contrasenaIngresada == null) {
            return false;
        }
        if (estaCifrada(guardada)) {
            return encoder.matches(contrasenaIngresada, guardada);
        }
        // Usuario heredado: la contrasena sigue en texto plano.
        return guardada.equals(contrasenaIngresada);
    }

    public boolean tieneContrasena(Usuario usuario) {
        String guardada = usuario.getContraseña();
        return guardada != null && !guardada.isBlank();
    }
}
