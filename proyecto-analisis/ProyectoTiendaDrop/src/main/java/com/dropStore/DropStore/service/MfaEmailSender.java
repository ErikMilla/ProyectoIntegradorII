package com.dropStore.DropStore.service;

import java.time.Duration;

public interface MfaEmailSender {
    boolean disponible();

    void enviarCodigo(String destinatario, String codigo, Duration vigencia);

    default void enviarCodigoRegistro(String destinatario, String codigo, Duration vigencia) {
        enviarCodigo(destinatario, codigo, vigencia);
    }
}
