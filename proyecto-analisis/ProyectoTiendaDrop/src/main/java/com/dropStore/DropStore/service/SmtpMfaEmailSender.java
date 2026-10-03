package com.dropStore.DropStore.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class SmtpMfaEmailSender implements MfaEmailSender {

    private final JavaMailSender mailSender;
    private final boolean habilitado;
    private final String remitente;

    public SmtpMfaEmailSender(JavaMailSender mailSender,
                              @Value("${dropstore.mfa.mail-enabled:false}") boolean habilitado,
                              @Value("${spring.mail.username:}") String remitente) {
        this.mailSender = mailSender;
        this.habilitado = habilitado;
        this.remitente = remitente;
    }

    @Override
    public boolean disponible() {
        return habilitado && remitente != null && !remitente.isBlank();
    }

    @Override
    public void enviarCodigo(String destinatario, String codigo, Duration vigencia) {
        enviar(destinatario, codigo, vigencia,
                "Tu código de acceso a Drop Store",
                "Tu código de verificación es: ");
    }

    @Override
    public void enviarCodigoRegistro(String destinatario, String codigo, Duration vigencia) {
        enviar(destinatario, codigo, vigencia,
                "Confirma tu correo en Drop Store",
                "Tu código para completar el registro es: ");
    }

    private void enviar(String destinatario, String codigo, Duration vigencia,
                        String asunto, String introduccion) {
        if (!disponible()) {
            throw new MfaDeliveryException("El servicio de correo no está configurado.");
        }
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(introduccion + codigo
                + "\n\nVence en " + vigencia.toMinutes() + " minutos."
                + "\nSi no realizaste esta solicitud, ignora este mensaje.");
        try {
            mailSender.send(mensaje);
        } catch (MailException ex) {
            throw new MfaDeliveryException("No se pudo enviar el código de verificación.", ex);
        }
    }
}
