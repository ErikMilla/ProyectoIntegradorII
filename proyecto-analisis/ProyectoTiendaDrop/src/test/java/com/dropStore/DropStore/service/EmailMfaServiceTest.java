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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmailMfaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-10-02T18:00:00Z");

    @Test
    void creaUnCodigoDeSeisDigitosLigadoALaSesion() {
        CapturingSender sender = new CapturingSender();
        EmailMfaService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MockHttpSession session = new MockHttpSession();

        MfaChallenge challenge = service.iniciar(usuarioAdmin(), session);

        assertEquals(6, sender.ultimoCodigo().length());
        assertTrue(sender.ultimoCodigo().matches("\\d{6}"));
        assertEquals("a***n@dropstore.local", challenge.correoEnmascarado());
        assertEquals(300, challenge.expiraEnSegundos());
        assertTrue(service.verificar(session, challenge.id(), sender.ultimoCodigo()).valido());
    }

    @Test
    void rechazaElCodigoDesdeOtraSesion() {
        CapturingSender sender = new CapturingSender();
        EmailMfaService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MfaChallenge challenge = service.iniciar(usuarioAdmin(), new MockHttpSession());

        MfaVerification result = service.verificar(
                new MockHttpSession(), challenge.id(), sender.ultimoCodigo());

        assertFalse(result.valido());
        assertEquals(MfaVerification.Status.INVALIDO, result.status());
    }

    @Test
    void invalidaElDesafioDespuesDeCincoIntentosIncorrectos() {
        CapturingSender sender = new CapturingSender();
        EmailMfaService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MockHttpSession session = new MockHttpSession();
        MfaChallenge challenge = service.iniciar(usuarioAdmin(), session);
        String codigoIncorrecto = sender.ultimoCodigo().startsWith("0") ? "100000" : "000000";

        MfaVerification result = null;
        for (int intento = 0; intento < 5; intento++) {
            result = service.verificar(session, challenge.id(), codigoIncorrecto);
        }

        assertEquals(MfaVerification.Status.BLOQUEADO, result.status());
        assertEquals(MfaVerification.Status.INVALIDO,
                service.verificar(session, challenge.id(), sender.ultimoCodigo()).status());
    }

    @Test
    void rechazaUnCodigoVencido() {
        CapturingSender sender = new CapturingSender();
        MockHttpSession session = new MockHttpSession();
        EmailMfaService inicial = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MfaChallenge challenge = inicial.iniciar(usuarioAdmin(), session);

        EmailMfaService seisMinutosDespues = service(sender,
                Clock.fixed(AHORA.plus(Duration.ofMinutes(6)), ZoneOffset.UTC));
        MfaVerification result = seisMinutosDespues.verificar(
                session, challenge.id(), sender.ultimoCodigo());

        assertEquals(MfaVerification.Status.EXPIRADO, result.status());
    }

    @Test
    void impideReenviosAntesDeSesentaSegundos() {
        CapturingSender sender = new CapturingSender();
        MockHttpSession session = new MockHttpSession();
        EmailMfaService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        MfaChallenge challenge = service.iniciar(usuarioAdmin(), session);

        MfaResendResult result = service.reenviar(session, challenge.id());

        assertFalse(result.enviado());
        assertTrue(result.esperaSegundos() > 0);
        assertEquals(1, sender.codigos.size());
    }

    @Test
    void impideSolicitarCodigosNuevosRepetidamenteAunqueSeCambieDeSesion() {
        CapturingSender sender = new CapturingSender();
        EmailMfaService service = service(sender, Clock.fixed(AHORA, ZoneOffset.UTC));
        service.iniciar(usuarioAdmin(), new MockHttpSession());

        assertThrows(MfaRateLimitException.class,
                () -> service.iniciar(usuarioAdmin(), new MockHttpSession()));
        assertEquals(1, sender.codigos.size());
    }

    private EmailMfaService service(CapturingSender sender, Clock clock) {
        return new EmailMfaService(sender, new BCryptPasswordEncoder(4), clock, false,
                Duration.ofMinutes(5), 5, Duration.ofSeconds(60));
    }

    private Usuario usuarioAdmin() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setCorreo("admin@dropstore.local");
        usuario.setRol("ADMIN");
        return usuario;
    }

    private static final class CapturingSender implements MfaEmailSender {
        private final List<String> codigos = new ArrayList<>();

        @Override
        public boolean disponible() {
            return true;
        }

        @Override
        public void enviarCodigo(String destinatario, String codigo, Duration vigencia) {
            codigos.add(codigo);
        }

        String ultimoCodigo() {
            return codigos.get(codigos.size() - 1);
        }
    }
}
