package com.dropStore.DropStore.service;

import com.dropStore.DropStore.Repositorio.DetalleVentaRepository;
import com.dropStore.DropStore.Repositorio.VentaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReporteService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;

    public ReporteService(VentaRepository ventaRepository, DetalleVentaRepository detalleVentaRepository) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
    }

    public Map<String, Object> resumen() {
        double descuentos = numero(ventaRepository.sumarDescuentos());
        double margen = numero(detalleVentaRepository.calcularMargenBrutoEstimado());
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("totalVentas", ventaRepository.count());
        respuesta.put("ingresos", numero(ventaRepository.sumarIngresos()));
        respuesta.put("descuentos", descuentos);
        respuesta.put("gananciaEstimada", Math.max(0, margen - descuentos));
        respuesta.put("ventasOnline", ventaRepository.contarPorCanal("Online"));
        respuesta.put("ventasPresenciales", ventaRepository.contarPorCanal("Presencial"));
        respuesta.put("productosMasVendidos", productosMasVendidos(5));
        return respuesta;
    }

    public List<Map<String, Object>> productosMasVendidos(int limite) {
        return detalleVentaRepository.productosMasVendidos(PageRequest.of(0, limite)).stream()
                .map(fila -> {
                    Map<String, Object> producto = new LinkedHashMap<>();
                    producto.put("productoId", fila[0]);
                    producto.put("nombre", fila[1]);
                    producto.put("unidades", fila[2]);
                    producto.put("importe", fila[3]);
                    return producto;
                }).toList();
    }

    private double numero(Number valor) {
        return valor == null ? 0 : valor.doubleValue();
    }
}
