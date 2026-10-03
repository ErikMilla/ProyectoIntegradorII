package com.dropStore.DropStore.service;

public class MfaRateLimitException extends RuntimeException {
    private final int esperaSegundos;

    public MfaRateLimitException(int esperaSegundos) {
        super("Debes esperar antes de solicitar otro código.");
        this.esperaSegundos = esperaSegundos;
    }

    public int getEsperaSegundos() {
        return esperaSegundos;
    }
}
