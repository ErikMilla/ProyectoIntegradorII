package com.dropStore.DropStore.service;

/**
 * Lo que el buscador entendió de una frase escrita por el cliente.
 *
 * Cada campo es un filtro que el catálogo ya sabe aplicar; los que vienen en
 * null no se mencionaron. {@code texto} son las palabras que no encajaron en
 * ningún filtro y se buscan en el nombre, modelo y marca del producto.
 *
 * Ejemplo: "nike blancas para mujer talla 38 hasta 400 soles"
 * → marca Nike, color Blanco, género Mujer, talla 38, precio máximo 400, texto "".
 */
public record InterpretacionBusqueda(
        String consulta,
        String genero,
        String marca,
        String categoria,
        String color,
        Double talla,
        Double precioMinimo,
        Double precioMaximo,
        String orden,
        String texto
) {
}
