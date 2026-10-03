package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RegistrationVerificationServiceTest {

    private static final Instant AHORA = Instant.parse("2026-10-02T20:00:00Z");

    @Test
    void conservaElRegistroPendienteYLoEntregaSoloConElCodigoCorrecto() {
        CapturingSender sender = new CapturingSender();
        RegistrationVerificationService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MockHttpSession session = new MockHttpSession();

        RegistrationChallenge challenge = service.iniciar(nuevoCliente(), null, session);
        RegistrationVerification verification = service.verificar(
                session, challenge.id(), sender.ultimoCodigo());

        assertTrue(verification.valido());
        assertEquals("nuevo@correo.com", verification.registro().correo());
        assertEquals("hash-bcrypt", verification.registro().contrasenaCifrada());
        assertNull(verification.registro().usuarioExistenteId());
    }

    @Test
    void rechazaElCodigoDesdeOtraSesion() {
        CapturingSender sender = new CapturingSender();
        RegistrationVerificationService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        RegistrationChallenge challenge = service.iniciar(nuevoCliente(), null, new MockHttpSession());

        RegistrationVerification result = service.verificar(
                new MockHttpSession(), challenge.id(), sender.ultimoCodigo());

        assertFalse(result.valido());
        assertEquals(RegistrationVerification.Status.INVALIDO, result.status());
    }

    @Test
    void eliminaElRegistroPendienteAlQuintoIntentoIncorrecto() {
        CapturingSender sender = new CapturingSender();
        RegistrationVerificationService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MockHttpSession session = new MockHttpSession();
        RegistrationChallenge challenge = service.iniciar(nuevoCliente(), null, session);
        String incorrecto = sender.ultimoCodigo().startsWith("0") ? "100000" : "000000";

        RegistrationVerification result = null;
        for (int i = 0; i < 5; i++) result = service.verificar(session, challenge.id(), incorrecto);

        assertEquals(RegistrationVerification.Status.BLOQUEADO, result.status());
        assertEquals(RegistrationVerification.Status.INVALIDO,
                service.verificar(session, challenge.id(), sender.ultimoCodigo()).status());
    }

    @Test
    void eliminaElRegistroPendienteCuandoElCodigoVence() {
        CapturingSender sender = new CapturingSender();
        MockHttpSession session = new MockHttpSession();
        RegistrationVerificationService inicial = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        RegistrationChallenge challenge = inicial.iniciar(nuevoCliente(), null, session);

        RegistrationVerificationService vencido = service(sender,
                Clock.fixed(AHORA.plus(Duration.ofMinutes(6)), ZoneOffset.UTC));
        RegistrationVerification result = vencido.verificar(
                session, challenge.id(), sender.ultimoCodigo());

        assertEquals(RegistrationVerification.Status.EXPIRADO, result.status());
    }

    private RegistrationVerificationService service(CapturingSender sender, Clock clock) {
        return new RegistrationVerificationService(sender, new BCryptPasswordEncoder(4), clock,
                false, Duration.ofMinutes(5), 5, Duration.ofSeconds(60));
    }

    private Usuario nuevoCliente() {
        Usuario usuario = new Usuario();
        usuario.setDni("76543210");
        usuario.setNombre("Nuevo");
        usuario.setApellido("Cliente");
        usuario.setCorreo("nuevo@correo.com");
        usuario.setTelefono("999888777");
        usuario.setDireccion("Lima");
        usuario.setContraseña("hash-bcrypt");
        usuario.setRol("CLIENTE");
        return usuario;
    }

    private static final class CapturingSender implements MfaEmailSender {
        private final List<String> codigos = new ArrayList<>();

        @Override public boolean disponible() { return true; }

        @Override
        public void enviarCodigo(String destinatario, String codigo, Duration vigencia) {
            codigos.add(codigo);
        }

        @Override
        public void enviarCodigoRegistro(String destinatario, String codigo, Duration vigencia) {
            codigos.add(codigo);
        }

        String ultimoCodigo() { return codigos.get(codigos.size() - 1); }
    }
}
