package com.dropStore.DropStore.service;

public record MfaResendResult(
        boolean enviado,
        Status status,
        int esperaSegundos,
        int expiraEnSegundos,
        String codigoDesarrollo) {

    public enum Status { ENVIADO, ESPERA, EXPIRADO, INVALIDO }

    public static MfaResendResult enviado(int expiraEnSegundos, String codigoDesarrollo) {
        return new MfaResendResult(true, Status.ENVIADO, 0, expiraEnSegundos, codigoDesarrollo);
    }

    public static MfaResendResult error(Status status, int esperaSegundos) {
        return new MfaResendResult(false, status, esperaSegundos, 0, null);
    }
}
