package com.dropStore.DropStore.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class InterpreteConsultaTest {

    private final InterpreteConsulta interprete = new InterpreteConsulta(
            List.of("Nike", "Adidas", "Jordan", "New Balance"),
            List.of("Urbano", "Retro", "Deportivo"),
            List.of("Blanco", "Blanco/Negro", "Lila"));

    @Test
    void entiendeUnaFraseCompleta() {
        InterpretacionBusqueda r = interprete.interpretar(
                "Quiero unas zapatillas Nike blancas para mujer talla 38 de menos de 400 soles");

        assertEquals("Nike", r.marca());
        assertEquals("Blanco", r.color());
        assertEquals("Mujer", r.genero());
        assertEquals(38.0, r.talla());
        assertEquals(400.0, r.precioMaximo());
        assertNull(r.precioMinimo());
        assertEquals("", r.texto());
    }

    @Test
    void loQueNoEsFiltroQuedaComoTexto() {
        InterpretacionBusqueda r = interprete.interpretar("air force negras de hombre");

        assertEquals("Negro", r.color());
        assertEquals("Hombre", r.genero());
        assertEquals("air force", r.texto());
    }

    @Test
    void reconoceCategoriasYGeneroSinImportarTildesNiPlurales() {
        InterpretacionBusqueda r = interprete.interpretar("urbanas para niños");

        assertEquals("Urbano", r.categoria());
        assertEquals("Niños", r.genero());
    }

    @Test
    void reconoceMarcasDeVariasPalabras() {
        InterpretacionBusqueda r = interprete.interpretar("new balance 990 talla 42,5");

        assertEquals("New Balance", r.marca());
        assertEquals(42.5, r.talla());
        assertEquals("990", r.texto());
    }

    @Test
    void leeRangosDePrecio() {
        InterpretacionBusqueda entre = interprete.interpretar("entre 400 y 200 soles");
        assertEquals(200.0, entre.precioMinimo());
        assertEquals(400.0, entre.precioMaximo());

        InterpretacionBusqueda desde = interprete.interpretar("jordan desde S/ 500");
        assertEquals("Jordan", desde.marca());
        assertEquals(500.0, desde.precioMinimo());
        assertNull(desde.precioMaximo());

        InterpretacionBusqueda suelto = interprete.interpretar("adidas de 300 soles");
        assertEquals(300.0, suelto.precioMaximo());
    }

    @Test
    void airMaxEsUnModeloNoUnPrecio() {
        InterpretacionBusqueda r = interprete.interpretar("nike air max 90");

        assertNull(r.precioMaximo());
        assertEquals("air max 90", r.texto());
    }

    @Test
    void dosValoresDelMismoFiltroNoRestringen() {
        InterpretacionBusqueda r = interprete.interpretar("nike o adidas para hombre o mujer");

        assertNull(r.marca());
        assertNull(r.genero());
        assertEquals("", r.texto());
    }

    @Test
    void baratasOrdenaPorPrecio() {
        assertEquals("precio-asc", interprete.interpretar("zapatillas baratas").orden());
        assertEquals("precio-desc", interprete.interpretar("las mas caras").orden());
    }

    @Test
    void ignoraTallasImposibles() {
        InterpretacionBusqueda r = interprete.interpretar("talla 99");

        assertNull(r.talla());
    }

    @Test
    void unaBusquedaVaciaNoAplicaFiltros() {
        InterpretacionBusqueda r = interprete.interpretar("   ");

        assertNull(r.marca());
        assertNull(r.genero());
        assertNull(r.talla());
        assertEquals("", r.texto());
    }
}
