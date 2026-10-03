package com.dropStore.DropStore.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class StockEventService {
    private final List<SseEmitter> conexiones = new CopyOnWriteArrayList<>();

    public SseEmitter conectar() {
        SseEmitter emitter = new SseEmitter(30L * 60L * 1000L);
        conexiones.add(emitter);
        emitter.onCompletion(() -> conexiones.remove(emitter));
        emitter.onTimeout(() -> conexiones.remove(emitter));
        emitter.onError(error -> conexiones.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("conectado").data("ok"));
        } catch (IOException error) {
            conexiones.remove(emitter);
        }
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void notificar(StockActualizadoEvent evento) {
        for (SseEmitter emitter : conexiones) {
            try {
                emitter.send(SseEmitter.event().name("stock").data(evento.motivo()));
            } catch (IOException error) {
                emitter.complete();
                conexiones.remove(emitter);
            }
        }
    }
}
