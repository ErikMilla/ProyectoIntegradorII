package com.dropStore.DropStore.controlador;

import com.dropStore.DropStore.service.StockEventService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stock")
public class StockEventController {
    private final StockEventService eventos;

    public StockEventController(StockEventService eventos) {
        this.eventos = eventos;
    }

    @GetMapping(value = "/eventos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter eventos() {
        return eventos.conectar();
    }
}
