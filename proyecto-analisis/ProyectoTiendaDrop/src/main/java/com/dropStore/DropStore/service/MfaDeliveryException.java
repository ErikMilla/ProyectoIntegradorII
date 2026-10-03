package com.dropStore.DropStore.service;

public class MfaDeliveryException extends RuntimeException {
    public MfaDeliveryException(String message) {
        super(message);
    }

    public MfaDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
