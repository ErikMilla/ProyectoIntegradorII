package com.dropStore.DropStore.service;

public record RegistrationVerification(
        boolean valido,
        Status status,
        PendingRegistration registro,
        int intentosRestantes) {

    public enum Status { VALIDO, INCORRECTO, EXPIRADO, BLOQUEADO, INVALIDO }

    public static RegistrationVerification valido(PendingRegistration registro) {
        return new RegistrationVerification(true, Status.VALIDO, registro, 0);
    }

    public static RegistrationVerification error(Status status, int restantes) {
        return new RegistrationVerification(false, status, null, restantes);
    }
}
