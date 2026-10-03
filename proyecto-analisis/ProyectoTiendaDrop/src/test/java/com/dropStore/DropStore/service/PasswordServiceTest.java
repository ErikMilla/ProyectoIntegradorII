package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordServiceTest {

    private PasswordService passwordService;

    @BeforeEach
    void preparar() {
        passwordService = new PasswordService(new BCryptPasswordEncoder());
    }

    private Usuario conContrasena(String guardada) {
        Usuario usuario = new Usuario();
        usuario.setContraseña(guardada);
        return usuario;
    }

    @Test
    void laContrasenaCifradaNoSeParaceALaOriginal() {
        String cifrada = passwordService.cifrar("Admin123");

        assertNotEquals("Admin123", cifrada);
        assertTrue(passwordService.estaCifrada(cifrada));
    }

    @Test
    void reconoceLaContrasenaCorrecta() {
        Usuario usuario = conContrasena(passwordService.cifrar("Admin123"));

        assertTrue(passwordService.coincide(usuario, "Admin123"));
    }

    @Test
    void rechazaLaContrasenaIncorrecta() {
        Usuario usuario = conContrasena(passwordService.cifrar("Admin123"));

        assertFalse(passwordService.coincide(usuario, "admin123"));
        assertFalse(passwordService.coincide(usuario, "otra"));
    }

    @Test
    void aceptaUsuariosHeredadosConContrasenaEnTextoPlano() {
        // Cuentas creadas antes de que el sistema cifrara contraseñas.
        Usuario usuario = conContrasena("claveplana");

        assertTrue(passwordService.coincide(usuario, "claveplana"));
        assertFalse(passwordService.estaCifrada(usuario.getContraseña()));
    }

    @Test
    void unUsuarioSinContrasenaNuncaCoincide() {
        // Es el caso de los clientes creados desde el panel de administración.
        assertFalse(passwordService.coincide(conContrasena(null), "loquesea"));
        assertFalse(passwordService.coincide(conContrasena(""), ""));
        assertFalse(passwordService.tieneContrasena(conContrasena(null)));
        assertFalse(passwordService.tieneContrasena(conContrasena("   ")));
    }

    @Test
    void unaContrasenaNulaNoDerribaLaComparacion() {
        Usuario usuario = conContrasena(passwordService.cifrar("Admin123"));

        assertFalse(passwordService.coincide(usuario, null));
    }
}
