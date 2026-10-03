package com.dropStore.DropStore.service;

public record MfaChallenge(
        String id,
        String correoEnmascarado,
        int expiraEnSegundos,
        String codigoDesarrollo) {
}
