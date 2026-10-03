package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.VentaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock VentaRepository ventaRepository;
    @Mock DetalleVentaRepository detalleVentaRepository;

    @Test
    void calculaGananciaYRankingSinConsultarCadaVentaPorSeparado() {
        when(ventaRepository.count()).thenReturn(4L);
        when(ventaRepository.sumarIngresos()).thenReturn(700.0);
        when(ventaRepository.sumarDescuentos()).thenReturn(20.0);
        when(ventaRepository.contarPorCanal("Online")).thenReturn(3L);
        when(ventaRepository.contarPorCanal("Presencial")).thenReturn(1L);
        when(detalleVentaRepository.calcularMargenBrutoEstimado()).thenReturn(220.0);
        when(detalleVentaRepository.productosMasVendidos(any(Pageable.class)))
                .thenReturn(List.<Object[]>of(new Object[]{7L, "Air Force 1", 9L, 900.0}));

        Map<String, Object> resumen = new ReporteService(ventaRepository, detalleVentaRepository).resumen();

        assertEquals(200.0, resumen.get("gananciaEstimada"));
        assertEquals(3L, resumen.get("ventasOnline"));
        Map<?, ?> primero = (Map<?, ?>) ((List<?>) resumen.get("productosMasVendidos")).get(0);
        assertEquals("Air Force 1", primero.get("nombre"));
        assertEquals(9L, primero.get("unidades"));
    }
}
