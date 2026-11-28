package com.dropStore.DropStore.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.MatchResult;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Convierte una frase en lenguaje natural en los filtros del catálogo.
 *
 * Funciona por reglas, sin servicios externos:
 * <ol>
 *   <li>Normaliza la frase: minúsculas, sin tildes, "38,5" pasa a "38.5".</li>
 *   <li>Extrae con expresiones regulares la talla ("talla 38") y el precio
 *       ("menos de 400", "desde 200", "entre 200 y 400", "300 soles").</li>
 *   <li>Reconoce género, marca, categoría y color comparando la raíz de cada
 *       palabra con el vocabulario del catálogo, así "blancas" encuentra
 *       "Blanco" y "urbanas" encuentra "Urbano".</li>
 *   <li>Descarta las palabras de relleno ("quiero", "unas", "para"...). Lo que
 *       queda se busca como texto en el nombre, modelo y marca.</li>
 * </ol>
 *
 * Si la frase menciona dos valores distintos del mismo filtro ("nike o adidas"),
 * ese filtro no se aplica: preferimos mostrar de más antes que esconder productos.
 *
 * La clase no depende de Spring: recibe el vocabulario en el constructor para
 * poder probarla sin base de datos.
 */
public class InterpreteConsulta {

    public static final int MAX_LONGITUD = 200;

    private static final double TALLA_MINIMA = 15;
    private static final double TALLA_MAXIMA = 50;

    private static final Map<String, String> GENEROS = crearGeneros();

    private static final List<String> COLORES_BASE = List.of(
            "Blanco", "Negro", "Rojo", "Azul", "Verde", "Gris", "Rosado", "Rosa", "Lila", "Morado",
            "Amarillo", "Naranja", "Beige", "Crema", "Marrón", "Celeste", "Dorado", "Plateado",
            "Turquesa", "Fucsia", "Mostaza", "Hueso");

    private static final Set<String> ORDEN_ASCENDENTE = Set.of(
            "barata", "baratas", "barato", "baratos", "economica", "economicas", "economico", "economicos");
    private static final Set<String> ORDEN_DESCENDENTE = Set.of("cara", "caras", "caro", "caros");

    /** Palabras que no aportan a la búsqueda. Se comparan ya normalizadas. */
    private static final Set<String> RELLENO = Set.of(
            "a", "al", "algo", "alguna", "algunas", "alguno", "algunos", "bonita", "bonitas", "bonito",
            "bonitos", "busco", "buscando", "buscar", "calza", "calzado", "calzados", "calzo", "color",
            "colores", "comprar", "con", "cuesten", "cueste", "de", "del", "desde", "el", "en", "entre", "estilo",
            "favor", "hasta", "hay", "la", "las", "linda", "lindas", "lindo", "lindos", "lo", "los", "marca", "mas", "me",
            "maximo", "menos", "mi", "minimo", "modelo", "modelos", "muestrame", "muy", "necesito", "nueva", "nuevas", "nuevo", "nuevos",
            "numero", "o", "par", "pares", "para", "por", "porfa", "porfavor", "precio", "que", "quiero",
            "s", "sean", "sneaker", "sneakers", "sol", "soles", "talla", "tallas", "tenis", "tienen",
            "tienes", "u", "un", "una", "unas", "uno", "unos", "ver", "y", "zapatilla", "zapatillas",
            "zapato", "zapatos");

    // "max" y "min" sueltos no cuentan como precio: "Air Max 90" es un modelo.
    private static final String PRECIO ="(?:s/\\s*)?(\\d+(?:\\.\\d+)?)(?:\\s*soles?\\b)?";

    private static final Pattern TALLA = Pattern.compile(
            "\\b(?:talla|tallas|numero|num|nro|calzo|calza)\\s*(\\d{2}(?:\\.5)?)\\b"
                    + "|\\b(\\d{2}(?:\\.5)?)\\s*eu\\b");
    private static final Pattern PRECIO_ENTRE = Pattern.compile(
            "\\bentre\\s+" + PRECIO + "\\s+(?:y|a)\\s+" + PRECIO);
    private static final Pattern PRECIO_MAXIMO = Pattern.compile(
            "\\b(?:menos\\s+de|hasta|maximo(?:\\s+de)?|por\\s+debajo\\s+de|no\\s+mas\\s+de"
                    + "|menor(?:es)?\\s+(?:a|de)|inferior(?:es)?\\s+a|tope(?:\\s+de)?)\\s+" + PRECIO);
    private static final Pattern PRECIO_MINIMO = Pattern.compile(
            "\\b(?:mas\\s+de|desde|minimo(?:\\s+de)?|por\\s+encima\\s+de"
                    + "|mayor(?:es)?\\s+(?:a|de)|superior(?:es)?\\s+a)\\s+" + PRECIO);
    private static final Pattern PRECIO_SUELTO = Pattern.compile(
            "\\bs/\\s*(\\d+(?:\\.\\d+)?)|\\b(\\d+(?:\\.\\d+)?)\\s*soles?\\b");

    private final List<Termino> marcas;
    private final List<Termino> categorias;
    private final List<Termino> colores;

    public InterpreteConsulta(List<String> marcas, List<String> categorias, List<String> coloresCatalogo) {
        this.marcas = vocabulario(marcas);
        this.categorias = vocabulario(categorias);
        List<String> colores = new ArrayList<>();
        for (String color : coloresCatalogo) {
            if (color == null) continue;
            // "Blanco/Negro" o "Blanco y negro" aportan dos colores.
            for (String parte : color.split("\\s*(?:/|,|\\s+y\\s+)\\s*")) {
                if (!parte.isBlank()) colores.add(capitalizar(parte.trim()));
            }
        }
        colores.addAll(COLORES_BASE);
        this.colores = vocabulario(colores);
    }

    public InterpretacionBusqueda interpretar(String consulta) {
        String original = consulta == null ? "" : consulta.trim();
        StringBuilder resto = new StringBuilder(normalizar(original));

        Double talla = null;
        Double precioMinimo = null;
        Double precioMaximo = null;

        MatchResult coincidencia = consumir(TALLA, resto);
        if (coincidencia != null) {
            double valor = Double.parseDouble(coincidencia.group(1) != null ? coincidencia.group(1) : coincidencia.group(2));
            if (valor >= TALLA_MINIMA && valor <= TALLA_MAXIMA) talla = valor;
        }

        coincidencia = consumir(PRECIO_ENTRE, resto);
        if (coincidencia != null) {
            double a = Double.parseDouble(coincidencia.group(1));
            double b = Double.parseDouble(coincidencia.group(2));
            precioMinimo = Math.min(a, b);
            precioMaximo = Math.max(a, b);
        }
        coincidencia = consumir(PRECIO_MAXIMO, resto);
        if (coincidencia != null) precioMaximo = Double.parseDouble(coincidencia.group(1));
        coincidencia = consumir(PRECIO_MINIMO, resto);
        if (coincidencia != null) precioMinimo = Double.parseDouble(coincidencia.group(1));
        coincidencia = consumir(PRECIO_SUELTO, resto);
        if (coincidencia != null && precioMaximo == null) {
            precioMaximo = Double.parseDouble(coincidencia.group(1) != null ? coincidencia.group(1) : coincidencia.group(2));
        }
        if (precioMinimo != null && precioMinimo <= 0) precioMinimo = null;
        if (precioMaximo != null && precioMaximo <= 0) precioMaximo = null;

        List<String> palabras = new ArrayList<>();
        for (String palabra : resto.toString().split("[\\s/]+")) {
            String limpia = palabra.replaceAll("^\\.+|\\.+$", "");
            if (!limpia.isEmpty()) palabras.add(limpia);
        }
        List<String> raices = palabras.stream().map(InterpreteConsulta::raiz).toList();
        boolean[] usada = new boolean[palabras.size()];

        Set<String> generos = new LinkedHashSet<>();
        Set<String> ordenes = new LinkedHashSet<>();
        for (int i = 0; i < palabras.size(); i++) {
            String palabra = palabras.get(i);
            if (GENEROS.containsKey(palabra)) {
                generos.add(GENEROS.get(palabra));
                usada[i] = true;
            } else if (ORDEN_ASCENDENTE.contains(palabra)) {
                ordenes.add("precio-asc");
                usada[i] = true;
            } else if (ORDEN_DESCENDENTE.contains(palabra)) {
                ordenes.add("precio-desc");
                usada[i] = true;
            }
        }
        Set<String> marcasHalladas = reconocer(this.marcas, raices, usada);
        Set<String> categoriasHalladas = reconocer(this.categorias, raices, usada);
        Set<String> coloresHallados = reconocer(this.colores, raices, usada);

        List<String> libres = new ArrayList<>();
        for (int i = 0; i < palabras.size(); i++) {
            if (!usada[i] && !RELLENO.contains(palabras.get(i))) libres.add(palabras.get(i));
        }

        return new InterpretacionBusqueda(
                original,
                unico(generos),
                unico(marcasHalladas),
                unico(categoriasHalladas),
                unico(coloresHallados),
                talla,
                precioMinimo,
                precioMaximo,
                unico(ordenes),
                String.join(" ", libres));
    }

    /** Minúsculas, sin tildes y solo letras, números, punto y barra. */
    static String normalizar(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT)
                .replaceAll("(\\d),(\\d)", "$1.$2")
                .replace("s/.", "s/")
                .replaceAll("[^a-z0-9./]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Raíz simple para comparar sin importar género ni número:
     * blanco, blanca, blancas → "blanc"; azul, azules → "azul".
     */
    static String raiz(String palabra) {
        String r = palabra;
        if (r.length() > 4 && r.endsWith("s")) r = r.substring(0, r.length() - 1);
        if (r.length() > 3 && (r.endsWith("a") || r.endsWith("o") || r.endsWith("e"))) {
            r = r.substring(0, r.length() - 1);
        }
        return r;
    }

    private static MatchResult consumir(Pattern patron, StringBuilder resto) {
        Matcher m = patron.matcher(resto);
        if (!m.find()) return null;
        MatchResult resultado = m.toMatchResult();
        resto.replace(resultado.start(), resultado.end(), " ");
        return resultado;
    }

    /** Marca como usadas las palabras que forman un término del vocabulario. */
    private static Set<String> reconocer(List<Termino> vocabulario, List<String> raices, boolean[] usada) {
        Set<String> hallados = new LinkedHashSet<>();
        for (Termino termino : vocabulario) {
            int largo = termino.raices().size();
            for (int i = 0; i + largo <= raices.size(); i++) {
                boolean coincide = true;
                for (int j = 0; j < largo && coincide; j++) {
                    coincide = !usada[i + j] && raices.get(i + j).equals(termino.raices().get(j));
                }
                if (!coincide) continue;
                for (int j = 0; j < largo; j++) usada[i + j] = true;
                hallados.add(termino.valor());
            }
        }
        return hallados;
    }

    /** Sin duplicados por raíz y con los términos de varias palabras primero. */
    private static List<Termino> vocabulario(List<String> valores) {
        Map<List<String>, Termino> porRaiz = new LinkedHashMap<>();
        for (String valor : valores) {
            if (valor == null || valor.isBlank()) continue;
            String normalizado = normalizar(valor);
            if (normalizado.isEmpty()) continue;
            List<String> raices = List.of(normalizado.split("[\\s/]+")).stream().map(InterpreteConsulta::raiz).toList();
            porRaiz.putIfAbsent(raices, new Termino(valor.trim(), raices));
        }
        List<Termino> terminos = new ArrayList<>(porRaiz.values());
        terminos.sort(Comparator.comparingInt((Termino t) -> t.raices().size()).reversed());
        return terminos;
    }

    private static String unico(Set<String> valores) {
        return valores.size() == 1 ? valores.iterator().next() : null;
    }

    private static String capitalizar(String texto) {
        String minusculas = texto.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(minusculas.charAt(0)) + minusculas.substring(1);
    }

    private static Map<String, String> crearGeneros() {
        Map<String, String> generos = new LinkedHashMap<>();
        for (String palabra : List.of("hombre", "hombres", "caballero", "caballeros", "varon", "varones",
                "masculino", "masculinos", "masculina", "masculinas")) {
            generos.put(palabra, "Hombre");
        }
        for (String palabra : List.of("mujer", "mujeres", "dama", "damas", "femenino", "femeninos",
                "femenina", "femeninas", "chica", "chicas")) {
            generos.put(palabra, "Mujer");
        }
        for (String palabra : List.of("nino", "ninos", "nina", "ninas", "infantil", "infantiles", "kids",
                "nene", "nenes", "nena", "nenas", "junior")) {
            generos.put(palabra, "Niños");
        }
        generos.put("unisex", "Unisex");
        return Map.copyOf(generos);
    }

    private record Termino(String valor, List<String> raices) {
        Termino {
            Objects.requireNonNull(valor);
        }
    }
}
