package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Modelo.Usuario;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class RegistrationVerificationService {

    private static final String SESSION_KEY = RegistrationVerificationService.class.getName() + ".PENDING";

    private final MfaEmailSender emailSender;
    private final PasswordEncoder encoder;
    private final Clock clock;
    private final boolean codigoDesarrolloHabilitado;
    private final Duration vigencia;
    private final int maxIntentos;
    private final Duration esperaReenvio;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, Instant> ultimoEnvioPorCorreo = new HashMap<>();

    public RegistrationVerificationService(
            MfaEmailSender emailSender,
            PasswordEncoder encoder,
            Clock clock,
            @Value("${dropstore.mfa.dev-code-enabled:false}") boolean codigoDesarrolloHabilitado,
            @Value("${dropstore.mfa.code-ttl:PT5M}") Duration vigencia,
            @Value("${dropstore.mfa.max-attempts:5}") int maxIntentos,
            @Value("${dropstore.mfa.resend-cooldown:PT60S}") Duration esperaReenvio) {
        this.emailSender = emailSender;
        this.encoder = encoder;
        this.clock = clock;
        this.codigoDesarrolloHabilitado = codigoDesarrolloHabilitado;
        this.vigencia = vigencia;
        this.maxIntentos = maxIntentos;
        this.esperaReenvio = esperaReenvio;
    }

    public RegistrationChallenge iniciar(Usuario usuario, Long usuarioExistenteId, HttpSession session) {
        asegurarCanalDisponible();
        Instant ahora = clock.instant();
        reservarEnvio(usuario.getCorreo(), ahora);
        String codigo = nuevoCodigo();
        PendingRegistration registro = new PendingRegistration(
                usuarioExistenteId, usuario.getDni(), usuario.getNombre(), usuario.getApellido(),
                usuario.getCorreo(), usuario.getTelefono(), usuario.getDireccion(), usuario.getContraseña());
        PendingChallenge challenge = new PendingChallenge(
                UUID.randomUUID().toString(), registro, encoder.encode(codigo),
                ahora.plus(vigencia), ahora, 0);

        try {
            if (emailSender.disponible()) {
                emailSender.enviarCodigoRegistro(usuario.getCorreo(), codigo, vigencia);
            }
        } catch (RuntimeException ex) {
            liberarEnvio(usuario.getCorreo(), ahora);
            throw ex;
        }
        session.setAttribute(SESSION_KEY, challenge);
        return respuesta(challenge, codigo);
    }

    public RegistrationVerification verificar(HttpSession session, String challengeId, String codigo) {
        PendingChallenge challenge = pendiente(session, challengeId);
        if (challenge == null) {
            return RegistrationVerification.error(RegistrationVerification.Status.INVALIDO, 0);
        }
        if (!clock.instant().isBefore(challenge.expiraEn())) {
            session.removeAttribute(SESSION_KEY);
            return RegistrationVerification.error(RegistrationVerification.Status.EXPIRADO, 0);
        }

        boolean formatoValido = codigo != null && codigo.matches("\\d{6}");
        if (!formatoValido || !encoder.matches(codigo, challenge.codigoHash())) {
            int intentos = challenge.intentosFallidos() + 1;
            if (intentos >= maxIntentos) {
                session.removeAttribute(SESSION_KEY);
                return RegistrationVerification.error(RegistrationVerification.Status.BLOQUEADO, 0);
            }
            session.setAttribute(SESSION_KEY, challenge.conIntentos(intentos));
            return RegistrationVerification.error(
                    RegistrationVerification.Status.INCORRECTO, maxIntentos - intentos);
        }

        session.removeAttribute(SESSION_KEY);
        return RegistrationVerification.valido(challenge.registro());
    }

    public MfaResendResult reenviar(HttpSession session, String challengeId) {
        PendingChallenge challenge = pendiente(session, challengeId);
        if (challenge == null) return MfaResendResult.error(MfaResendResult.Status.INVALIDO, 0);

        Instant ahora = clock.instant();
        if (!ahora.isBefore(challenge.expiraEn())) {
            session.removeAttribute(SESSION_KEY);
            return MfaResendResult.error(MfaResendResult.Status.EXPIRADO, 0);
        }
        Instant siguiente = challenge.enviadoEn().plus(esperaReenvio);
        if (ahora.isBefore(siguiente)) {
            int espera = Math.max(1, Math.toIntExact(Duration.between(ahora, siguiente).toSeconds()));
            return MfaResendResult.error(MfaResendResult.Status.ESPERA, espera);
        }

        asegurarCanalDisponible();
        reservarEnvio(challenge.registro().correo(), ahora);
        String codigo = nuevoCodigo();
        try {
            if (emailSender.disponible()) {
                emailSender.enviarCodigoRegistro(challenge.registro().correo(), codigo, vigencia);
            }
        } catch (RuntimeException ex) {
            liberarEnvio(challenge.registro().correo(), ahora);
            throw ex;
        }
        PendingChallenge renovado = new PendingChallenge(
                challenge.id(), challenge.registro(), encoder.encode(codigo),
                ahora.plus(vigencia), ahora, 0);
        session.setAttribute(SESSION_KEY, renovado);
        return MfaResendResult.enviado(Math.toIntExact(vigencia.toSeconds()),
                codigoDesarrolloHabilitado ? codigo : null);
    }

    private PendingChallenge pendiente(HttpSession session, String challengeId) {
        if (session == null || challengeId == null || challengeId.isBlank()) return null;
        Object value = session.getAttribute(SESSION_KEY);
        if (!(value instanceof PendingChallenge challenge) || !challenge.id().equals(challengeId)) return null;
        return challenge;
    }

    private RegistrationChallenge respuesta(PendingChallenge challenge, String codigo) {
        return new RegistrationChallenge(challenge.id(),
                EmailMfaService.enmascarar(challenge.registro().correo()),
                Math.toIntExact(vigencia.toSeconds()), codigoDesarrolloHabilitado ? codigo : null);
    }

    private void asegurarCanalDisponible() {
        if (!emailSender.disponible() && !codigoDesarrolloHabilitado) {
            throw new MfaDeliveryException("El envío de códigos por correo no está disponible.");
        }
    }

    private String nuevoCodigo() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private synchronized void reservarEnvio(String correo, Instant ahora) {
        String clave = correo.trim().toLowerCase();
        ultimoEnvioPorCorreo.entrySet().removeIf(entry ->
                entry.getValue().plus(Duration.ofHours(1)).isBefore(ahora));
        Instant ultimo = ultimoEnvioPorCorreo.get(clave);
        if (ultimo != null && ahora.isBefore(ultimo.plus(esperaReenvio))) {
            int espera = Math.max(1, Math.toIntExact(
                    Duration.between(ahora, ultimo.plus(esperaReenvio)).toSeconds()));
            throw new MfaRateLimitException(espera);
        }
        ultimoEnvioPorCorreo.put(clave, ahora);
    }

    private synchronized void liberarEnvio(String correo, Instant reservado) {
        ultimoEnvioPorCorreo.remove(correo.trim().toLowerCase(), reservado);
    }

    private record PendingChallenge(
            String id,
            PendingRegistration registro,
            String codigoHash,
            Instant expiraEn,
            Instant enviadoEn,
            int intentosFallidos) implements Serializable {

        PendingChallenge conIntentos(int intentos) {
            return new PendingChallenge(id, registro, codigoHash, expiraEn, enviadoEn, intentos);
        }
    }
}
