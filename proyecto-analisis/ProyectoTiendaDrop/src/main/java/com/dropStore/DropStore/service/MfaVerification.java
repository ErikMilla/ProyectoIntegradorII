package com.dropStore.DropStore.service;

public record MfaVerification(boolean valido, Status status, Long usuarioId, int intentosRestantes) {

    public enum Status { VALIDO, INCORRECTO, EXPIRADO, BLOQUEADO, INVALIDO }

    public static MfaVerification valido(Long usuarioId) {
        return new MfaVerification(true, Status.VALIDO, usuarioId, 0);
    }

    public static MfaVerification error(Status status, int intentosRestantes) {
        return new MfaVerification(false, status, null, intentosRestantes);
    }
}
