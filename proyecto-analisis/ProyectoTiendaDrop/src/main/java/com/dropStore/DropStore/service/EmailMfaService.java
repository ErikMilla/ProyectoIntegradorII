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
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailMfaService {

    private static final String SESSION_KEY = EmailMfaService.class.getName() + ".PENDING";

    private final MfaEmailSender emailSender;
    private final PasswordEncoder encoder;
    private final Clock clock;
    private final boolean codigoDesarrolloHabilitado;
    private final Duration vigencia;
    private final int maxIntentos;
    private final Duration esperaReenvio;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, Instant> ultimoEnvioPorCorreo = new HashMap<>();

    public EmailMfaService(MfaEmailSender emailSender, PasswordEncoder encoder, Clock clock,
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

    public MfaChallenge iniciar(Usuario usuario, HttpSession session) {
        if (!emailSender.disponible() && !codigoDesarrolloHabilitado) {
            throw new MfaDeliveryException("El envío de códigos por correo no está disponible.");
        }

        String codigo = nuevoCodigo();
        Instant ahora = clock.instant();
        reservarEnvio(usuario.getCorreo(), ahora);
        PendingChallenge pending = new PendingChallenge(
                UUID.randomUUID().toString(), usuario.getId(), usuario.getCorreo(),
                encoder.encode(codigo), ahora.plus(vigencia), ahora, 0);

        try {
            if (emailSender.disponible()) {
                emailSender.enviarCodigo(usuario.getCorreo(), codigo, vigencia);
            }
        } catch (RuntimeException ex) {
            liberarEnvio(usuario.getCorreo(), ahora);
            throw ex;
        }
        session.setAttribute(SESSION_KEY, pending);

        return new MfaChallenge(pending.id(), enmascarar(usuario.getCorreo()),
                Math.toIntExact(vigencia.toSeconds()), codigoDesarrolloHabilitado ? codigo : null);
    }

    public MfaVerification verificar(HttpSession session, String challengeId, String codigo) {
        PendingChallenge pending = pendiente(session, challengeId);
        if (pending == null) {
            return MfaVerification.error(MfaVerification.Status.INVALIDO, 0);
        }
        if (!clock.instant().isBefore(pending.expiraEn())) {
            session.removeAttribute(SESSION_KEY);
            return MfaVerification.error(MfaVerification.Status.EXPIRADO, 0);
        }

        boolean formatoValido = codigo != null && codigo.matches("\\d{6}");
        if (!formatoValido || !encoder.matches(codigo, pending.codigoHash())) {
            int intentos = pending.intentosFallidos() + 1;
            if (intentos >= maxIntentos) {
                session.removeAttribute(SESSION_KEY);
                return MfaVerification.error(MfaVerification.Status.BLOQUEADO, 0);
            }
            session.setAttribute(SESSION_KEY, pending.conIntentos(intentos));
            return MfaVerification.error(MfaVerification.Status.INCORRECTO, maxIntentos - intentos);
        }

        session.removeAttribute(SESSION_KEY);
        return MfaVerification.valido(pending.usuarioId());
    }

    public MfaResendResult reenviar(HttpSession session, String challengeId) {
        PendingChallenge pending = pendiente(session, challengeId);
        if (pending == null) {
            return MfaResendResult.error(MfaResendResult.Status.INVALIDO, 0);
        }

        Instant ahora = clock.instant();
        if (!ahora.isBefore(pending.expiraEn())) {
            session.removeAttribute(SESSION_KEY);
            return MfaResendResult.error(MfaResendResult.Status.EXPIRADO, 0);
        }

        Instant siguienteEnvio = pending.enviadoEn().plus(esperaReenvio);
        if (ahora.isBefore(siguienteEnvio)) {
            int espera = Math.max(1, Math.toIntExact(Duration.between(ahora, siguienteEnvio).toSeconds()));
            return MfaResendResult.error(MfaResendResult.Status.ESPERA, espera);
        }

        if (!emailSender.disponible() && !codigoDesarrolloHabilitado) {
            throw new MfaDeliveryException("El envío de códigos por correo no está disponible.");
        }

        String codigo = nuevoCodigo();
        reservarEnvio(pending.correo(), ahora);
        try {
            if (emailSender.disponible()) {
                emailSender.enviarCodigo(pending.correo(), codigo, vigencia);
            }
        } catch (RuntimeException ex) {
            liberarEnvio(pending.correo(), ahora);
            throw ex;
        }
        PendingChallenge renovado = new PendingChallenge(
                pending.id(), pending.usuarioId(), pending.correo(), encoder.encode(codigo),
                ahora.plus(vigencia), ahora, 0);
        session.setAttribute(SESSION_KEY, renovado);
        return MfaResendResult.enviado(Math.toIntExact(vigencia.toSeconds()),
                codigoDesarrolloHabilitado ? codigo : null);
    }

    private PendingChallenge pendiente(HttpSession session, String challengeId) {
        if (session == null || challengeId == null || challengeId.isBlank()) return null;
        Object value = session.getAttribute(SESSION_KEY);
        if (!(value instanceof PendingChallenge pending) || !pending.id().equals(challengeId)) return null;
        return pending;
    }

    private String nuevoCodigo() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private synchronized void reservarEnvio(String correo, Instant ahora) {
        String clave = correo.trim().toLowerCase();
        ultimoEnvioPorCorreo.entrySet().removeIf(entry ->
                entry.getValue().plus(Duration.ofHours(1)).isBefore(ahora));
        Instant ultimoEnvio = ultimoEnvioPorCorreo.get(clave);
        if (ultimoEnvio != null && ahora.isBefore(ultimoEnvio.plus(esperaReenvio))) {
            int espera = Math.max(1, Math.toIntExact(
                    Duration.between(ahora, ultimoEnvio.plus(esperaReenvio)).toSeconds()));
            throw new MfaRateLimitException(espera);
        }
        ultimoEnvioPorCorreo.put(clave, ahora);
    }

    private synchronized void liberarEnvio(String correo, Instant instanteReservado) {
        ultimoEnvioPorCorreo.remove(correo.trim().toLowerCase(), instanteReservado);
    }

    static String enmascarar(String correo) {
        int arroba = correo.indexOf('@');
        if (arroba <= 0) return "***";
        String local = correo.substring(0, arroba);
        String dominio = correo.substring(arroba);
        if (local.length() == 1) return "*" + dominio;
        if (local.length() == 2) return local.charAt(0) + "*" + dominio;
        return local.charAt(0) + "*".repeat(local.length() - 2) + local.charAt(local.length() - 1) + dominio;
    }

    private record PendingChallenge(
            String id,
            Long usuarioId,
            String correo,
            String codigoHash,
            Instant expiraEn,
            Instant enviadoEn,
            int intentosFallidos) implements Serializable {

        PendingChallenge conIntentos(int intentos) {
            return new PendingChallenge(id, usuarioId, correo, codigoHash, expiraEn, enviadoEn, intentos);
        }
    }
}
