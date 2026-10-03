package com.dropStore.DropStore.service;

public record RegistrationChallenge(
        String id,
        String correoEnmascarado,
        int expiraEnSegundos,
        String codigoDesarrollo) {
}
