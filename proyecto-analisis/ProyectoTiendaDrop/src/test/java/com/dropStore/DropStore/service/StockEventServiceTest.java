package com.dropStore.DropStore.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class StockEventServiceTest {

    @SuppressWarnings("unchecked")
    private static List<SseEmitter> conexiones(StockEventService servicio) {
        return (List<SseEmitter>) ReflectionTestUtils.getField(servicio, "conexiones");
    }

    @Test
    void cadaPantallaQueSeConectaQuedaRegistradaConSuTiempoMaximo() {
        StockEventService servicio = new StockEventService();

        SseEmitter primera = servicio.conectar();
        servicio.conectar();

        assertEquals(2, conexiones(servicio).size());
        assertEquals(30L * 60L * 1000L, primera.getTimeout());
    }

    @Test
    void unaConexionCaidaSeDescartaYLasDemasSiguenRecibiendoElAviso() throws IOException {
        StockEventService servicio = new StockEventService();
        SseEmitter caida = mock(SseEmitter.class);
        SseEmitter activa = mock(SseEmitter.class);
        doThrow(new IOException("cliente desconectado")).when(caida).send(any(SseEmitter.SseEventBuilder.class));
        conexiones(servicio).add(caida);
        conexiones(servicio).add(activa);

        servicio.notificar(new StockActualizadoEvent("venta"));

        verify(caida).complete();
        verify(activa).send(any(SseEmitter.SseEventBuilder.class));
        assertEquals(1, conexiones(servicio).size());
        assertTrue(conexiones(servicio).contains(activa));
    }
}
