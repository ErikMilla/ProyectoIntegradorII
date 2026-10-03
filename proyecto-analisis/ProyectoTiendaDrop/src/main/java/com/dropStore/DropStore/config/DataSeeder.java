package com.dropStore.DropStore.config;

import com.dropStore.DropStore.Modelo.Usuario;
import com.dropStore.DropStore.Modelo.categoria;
import com.dropStore.DropStore.Modelo.detalle_producto;
import com.dropStore.DropStore.Modelo.marca;
import com.dropStore.DropStore.Modelo.producto;
import com.dropStore.DropStore.Repositorio.CategoriaRepository;
import com.dropStore.DropStore.Repositorio.DetalleProductoRepository;
import com.dropStore.DropStore.Repositorio.MarcaRepository;
import com.dropStore.DropStore.Repositorio.ProductoRepository;
import com.dropStore.DropStore.Repositorio.UsuarioRepository;
import com.dropStore.DropStore.service.PasswordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Carga datos de demostración la primera vez que arranca el sistema.
 *
 * Regla de oro: NUNCA borra ni pisa información existente. Cada bloque se salta
 * si ya hay registros de ese tipo, así que se puede arrancar las veces que haga
 * falta sin duplicar nada.
 *
 * La carga es opcional. Para habilitarla hay que definir DROPSTORE_SEED=true
 * y una contraseña segura en DROPSTORE_DEMO_PASSWORD.
 */
@Component
@ConditionalOnProperty(name = "dropstore.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UsuarioRepository usuarioRepository;
    private final MarcaRepository marcaRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final DetalleProductoRepository detalleProductoRepository;
    private final PasswordService passwordService;

    @Value("${dropstore.seed.demo-password:}")
    private String demoPassword;

    @Value("${dropstore.seed.admin-email:admin@dropstore.local}")
    private String adminEmail;

    public DataSeeder(UsuarioRepository usuarioRepository,
                      MarcaRepository marcaRepository,
                      CategoriaRepository categoriaRepository,
                      ProductoRepository productoRepository,
                      DetalleProductoRepository detalleProductoRepository,
                      PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.marcaRepository = marcaRepository;
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.detalleProductoRepository = detalleProductoRepository;
        this.passwordService = passwordService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        crearUsuariosDeDemostracion();
        crearCatalogoDeEjemplo();
        ampliarCatalogoZapatillas();
    }

    // ------------------------------------------------------------------ catálogo

    private void crearCatalogoDeEjemplo() {
        if (productoRepository.count() > 0) {
            log.info("Catálogo ya cargado ({} productos). No se agregan productos de ejemplo.",
                    productoRepository.count());
            return;
        }

        Map<String, marca> marcas = crearMarcas("Nike", "Adidas", "Jordan");
        Map<String, categoria> categorias = crearCategorias("Urbano", "Retro", "Deportivo");

        // ---- Catálogo de ejemplo -------------------------------------------
        // Las fotos son las que ya estaban en la carpeta uploads/ del repositorio.

        producto af1Blanca = crearProducto(
                "Nike Air Force 1 07", "AF1-07-WHT",
                "/uploads/25a9c87e-7a8e-42c8-8ea1-b01807ff532d.jpg",
                280.00, 459.00, categorias.get("Urbano"),
                "El clásico infaltable. Cuero blanco total, suela Air y acabado limpio que combina con todo.");
        crearTallas(af1Blanca, marcas.get("Nike"), "Hombre", "Blanco",
                new double[]{39, 40, 41, 42, 43}, new int[]{6, 9, 12, 8, 4});

        producto af1Negra = crearProducto(
                "Nike Air Force 1 07 Panda", "AF1-07-BLK",
                "/uploads/4248da4d-238d-4fab-bc21-c1753395d326.jpg",
                285.00, 469.00, categorias.get("Urbano"),
                "Base blanca con swoosh negro en cuero martillado. La versión más pedida del AF1.");
        crearTallas(af1Negra, marcas.get("Nike"), "Unisex", "Blanco/Negro",
                new double[]{38, 39, 40, 41, 42}, new int[]{5, 8, 10, 7, 3});

        producto af1Lila = crearProducto(
                "Nike Air Force 1 07 Suede", "AF1-07-LIL",
                "/uploads/34ecd449-3c57-4963-9d07-2c976250ba0a.jpg",
                300.00, 489.00, categorias.get("Urbano"),
                "Gamuza lila con suela crema. Edición para mujer, de las que se agotan rápido.");
        crearTallas(af1Lila, marcas.get("Nike"), "Mujer", "Lila",
                new double[]{35, 36, 37, 38, 39}, new int[]{4, 6, 7, 5, 2});

        producto gammaForce = crearProducto(
                "Nike Gamma Force", "GMF-WHT-PNK",
                "/uploads/74a53c8e-1604-4a95-804f-b37cc68a0f45.jpeg",
                210.00, 349.00, categorias.get("Deportivo"),
                "Silueta ligera inspirada en los 80. Blanco con swoosh fucsia.");
        crearTallas(gammaForce, marcas.get("Nike"), "Mujer", "Blanco/Fucsia",
                new double[]{35, 36, 37, 38}, new int[]{5, 7, 6, 3});

        producto sambaBlanca = crearProducto(
                "Adidas Samba OG", "SMB-OG-WHT",
                "/uploads/c819f65b-a5b2-4734-a5ef-1afc0ecc8b27.jpg",
                240.00, 399.00, categorias.get("Retro"),
                "Cuero blanco, tres bandas negras y suela de goma. El retro que volvió para quedarse.");
        crearTallas(sambaBlanca, marcas.get("Adidas"), "Unisex", "Blanco",
                new double[]{38, 39, 40, 41, 42, 43}, new int[]{4, 7, 11, 9, 5, 2});

        producto sambaNegra = crearProducto(
                "Adidas Samba OG Core Black", "SMB-OG-BLK",
                "/uploads/c5b1490e-7176-4e4d-a2b7-d8fc9b435386.jpg",
                240.00, 399.00, categorias.get("Retro"),
                "La Samba en negro con bandas blancas y suela gum. Combina con todo.");
        crearTallas(sambaNegra, marcas.get("Adidas"), "Unisex", "Negro",
                new double[]{39, 40, 41, 42}, new int[]{6, 8, 5, 3});

        producto jordanMocha = crearProducto(
                "Air Jordan 1 Retro High OG", "AJ1-HI-MCH",
                "/uploads/069b3f69-4b89-4531-a1da-708f317daaf4.jpg",
                560.00, 899.00, categorias.get("Retro"),
                "Colorway Dark Mocha en cuero premium. Pieza de colección, stock muy limitado.");
        crearTallas(jordanMocha, marcas.get("Jordan"), "Hombre", "Marrón/Crema",
                new double[]{40, 41, 42, 43}, new int[]{2, 3, 2, 1});

        log.info("Catálogo de ejemplo cargado: {} productos, {} variantes de talla.",
                productoRepository.count(), detalleProductoRepository.count());
    }

    private record PlantillaZapatilla(String marca, String categoria, String nombre) {}

    /**
     * Amplía el catálogo con 100 zapatillas más, repartidas entre hombre, mujer
     * y niños, cubriendo las categorías que pidió el negocio (Urbano, Entrenar,
     * Correr, Tenis, Básquet, Fútbol, Skateboarding, Retro running y Jordan).
     *
     * No hay 100 fotos de producto reales disponibles. La primera versión de
     * esto reutilizaba las 7 fotos que ya había en uploads/, repetidas entre
     * varios productos — y en la práctica eso se veía como si el catálogo
     * fuera el mismo producto 100 veces con otro nombre. Para que cada tarjeta
     * sea realmente distinta, cada producto genera su propia imagen (un
     * marcador visual con sus iniciales, marca y categoría), nunca una URL
     * externa ni una foto copiada de otro producto.
     *
     * Es un bloque independiente de crearCatalogoDeEjemplo() y se identifica
     * por el prefijo "Z2-" en el modelo. Los lotes anteriores se conservan:
     * este cargador nunca elimina información ya existente.
     */
    private void ampliarCatalogoZapatillas() {
        boolean yaCargado = productoRepository.findAll().stream()
                .anyMatch(p -> p.getModelo() != null && p.getModelo().startsWith("Z2-"));
        if (yaCargado) {
            log.info("Catálogo ampliado de zapatillas ya cargado. No se agrega de nuevo.");
            return;
        }

        Map<String, marca> marcas = crearMarcas("Nike", "Adidas", "Jordan");
        Map<String, categoria> categorias = crearCategorias(
                "Urbano", "Entrenar", "Correr", "Tenis", "Básquet", "Fútbol",
                "Skateboarding", "Retro running", "Jordan");

        Map<String, String[]> siluetasNike = new LinkedHashMap<>();
        siluetasNike.put("Urbano", new String[]{"Air Force 1 Mid '07", "Air Force 1 Shadow", "Blazer Low '77", "Court Vision Low", "Air Force 1 Crater"});
        siluetasNike.put("Entrenar", new String[]{"Metcon 9", "Free Metcon 5", "SuperRep Go 3", "Zoom Train Command", "City Rep TR"});
        siluetasNike.put("Correr", new String[]{"Air Zoom Pegasus 40", "Revolution 6", "Downshifter 12", "Air Zoom Structure 25", "Infinity Run 4"});
        siluetasNike.put("Tenis", new String[]{"Court Vision Low Next Nature", "Zoom Vapor Cage 4", "Court Legacy", "Air Zoom GP Turbo", "Court Royale 2"});
        siluetasNike.put("Básquet", new String[]{"Zoom Freak 5", "LeBron Witness 8", "Kyrie Flytrap 5", "Precision 6", "Air Max Impact 4"});
        siluetasNike.put("Fútbol", new String[]{"Mercurial Vapor 15", "Phantom GT2", "Tiempo Legend 10", "React Gato", "Premier 3"});
        siluetasNike.put("Skateboarding", new String[]{"SB Dunk Low Pro", "SB Check Canvas", "SB Chron 2", "SB Zoom Blazer Mid", "SB Force 58"});
        siluetasNike.put("Retro running", new String[]{"Air Max 90", "Air Max 97", "Air Max SC", "Air Max Excee", "Air Max Furyosa"});

        Map<String, String[]> siluetasAdidas = new LinkedHashMap<>();
        siluetasAdidas.put("Urbano", new String[]{"Forum Low", "Campus 00s", "Nizza Platform", "Continental 80"});
        siluetasAdidas.put("Entrenar", new String[]{"Dropset Trainer", "Ultraboost Trainer", "Amplimove Trainer", "Rapidmove Trainer"});
        siluetasAdidas.put("Correr", new String[]{"Ultraboost Light", "Adizero SL", "Duramo SL", "Galaxy 6"});
        siluetasAdidas.put("Tenis", new String[]{"Barricade", "Gamecourt 2", "CourtJam Control 3", "Avacourt"});
        siluetasAdidas.put("Básquet", new String[]{"Dame 8", "Harden Stepback 3", "Pro Model 2G", "Exhibit B"});
        siluetasAdidas.put("Fútbol", new String[]{"Predator Accuracy", "Copa Pure II", "X Crazyfast.1", "F50"});
        siluetasAdidas.put("Skateboarding", new String[]{"Adimatic", "Busenitz", "3MC", "Matchbreak Super"});
        siluetasAdidas.put("Retro running", new String[]{"Samba OG", "Gazelle", "SL 72", "Stan Smith"});

        Map<String, String[]> siluetasJordan = new LinkedHashMap<>();
        siluetasJordan.put("Jordan", new String[]{
                "Air Jordan 1 Low", "Air Jordan 1 Mid", "Air Jordan 1 High OG", "Air Jordan 3 Retro",
                "Air Jordan 4 Retro", "Air Jordan 5 Retro", "Air Jordan 6 Retro", "Air Jordan 11 Retro",
                "Air Jordan 12 Retro", "Air Jordan 13 Retro", "Jordan Series ES", "Jordan Delta 3",
                "Jordan Spizike Low", "Jordan Max Aura 5", "Jordan Stay Loyal 3", "Air Jordan 1 Zoom CMFT",
                "Jordan Courtside 23", "Air Jordan 1 Elevate Low", "Jordan Flight Legacy", "Air Jordan 2 Retro"});
        siluetasJordan.put("Básquet", new String[]{
                "Air Jordan 36", "Air Jordan XXXVII", "Jordan Zion 3", "Jordan Luka 2",
                "Jordan Tatum 2", "Jordan One Take 5", "Jordan Why Not .6", "Jordan Max Aura 4"});

        List<PlantillaZapatilla> plantillas = new ArrayList<>();
        siluetasNike.forEach((cat, siluetas) -> {
            for (String silueta : siluetas) plantillas.add(new PlantillaZapatilla("Nike", cat, "Nike " + silueta));
        });
        siluetasAdidas.forEach((cat, siluetas) -> {
            for (String silueta : siluetas) plantillas.add(new PlantillaZapatilla("Adidas", cat, "Adidas " + silueta));
        });
        siluetasJordan.forEach((cat, siluetas) -> {
            for (String silueta : siluetas) plantillas.add(new PlantillaZapatilla("Jordan", cat, silueta));
        });

        // Colores de acento para la imagen generada de cada producto: rotan
        // independientemente del colorway real, solo para que la tarjeta se
        // distinga a simple vista de la de al lado.
        String[] acentos = {
                "#1d1d1d", "#c71924", "#1c3faa", "#0f766e", "#7c3aed",
                "#b45309", "#15803d", "#be185d", "#374151", "#0369a1",
        };

        String[] colores = {"Blanco", "Negro", "Blanco/Negro", "Gris", "Azul", "Rojo", "Verde", "Beige", "Multicolor", "Blanco/Rojo"};
        String[] generos = {"Hombre", "Mujer", "Niños"};

        Map<String, double[]> tallasPorGenero = new LinkedHashMap<>();
        tallasPorGenero.put("Hombre", new double[]{39, 40, 41, 42, 43});
        tallasPorGenero.put("Mujer", new double[]{35, 36, 37, 38, 39});
        tallasPorGenero.put("Niños", new double[]{28, 29, 30, 31, 32});

        Map<String, double[]> preciosPorCategoria = new LinkedHashMap<>();
        preciosPorCategoria.put("Urbano", new double[]{180, 320});
        preciosPorCategoria.put("Entrenar", new double[]{170, 300});
        preciosPorCategoria.put("Correr", new double[]{190, 340});
        preciosPorCategoria.put("Tenis", new double[]{175, 310});
        preciosPorCategoria.put("Básquet", new double[]{230, 420});
        preciosPorCategoria.put("Fútbol", new double[]{200, 360});
        preciosPorCategoria.put("Skateboarding", new double[]{160, 290});
        preciosPorCategoria.put("Retro running", new double[]{220, 400});
        preciosPorCategoria.put("Jordan", new double[]{380, 650});

        int indiceGlobal = 0;

        for (PlantillaZapatilla t : plantillas) {
            indiceGlobal++;
            String genero = generos[indiceGlobal % generos.length];
            String color = colores[indiceGlobal % colores.length];
            double[] tallas = tallasPorGenero.get(genero);
            int[] stocks = generarStocks(indiceGlobal, tallas.length);

            double[] precioBase = "Jordan".equals(t.marca())
                    ? preciosPorCategoria.get("Jordan")
                    : preciosPorCategoria.get(t.categoria());
            double variacion = (indiceGlobal % 5) * 8;
            double precioCompra = precioBase[0] + variacion;
            double precioVenta = precioBase[1] + variacion * 1.5;

            String modeloCodigo = "Z2-" + String.format("%03d", indiceGlobal);
            String nombreArchivo = "z2-" + String.format("%03d", indiceGlobal) + ".svg";
            String acento = acentos[indiceGlobal % acentos.length];
            String foto = generarImagenProducto(nombreArchivo, t.nombre(), t.marca(), t.categoria(), acento);
            String descripcion = t.categoria() + ", pensada para " + genero.toLowerCase()
                    + ". Colorway " + color + ".";

            producto p = crearProducto(t.nombre(), modeloCodigo, foto, precioCompra, precioVenta,
                    categorias.get(t.categoria()), descripcion);
            crearTallas(p, marcas.get(t.marca()), genero, color, tallas, stocks);
        }

        log.info("Catálogo ampliado: +{} zapatillas (hombre/mujer/niños) en {} categorías, cada una con su propia imagen generada.",
                plantillas.size(), categorias.size());
    }

    /**
     * Genera una imagen de marcador para un producto del catálogo: sus
     * iniciales sobre un círculo de color, con la marca y la categoría debajo.
     * No es una foto real, pero es única por producto y no depende de
     * ninguna URL externa.
     */
    private String generarImagenProducto(String nombreArchivo, String nombreProducto, String marcaNombre,
                                         String categoriaNombre, String colorAcento) {
        String iniciales = iniciales(nombreProducto, marcaNombre);
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
                  <rect width="640" height="640" fill="#f2f2f2"/>
                  <circle cx="320" cy="250" r="150" fill="%s"/>
                  <text x="320" y="272" font-family="Arial, sans-serif" font-size="88" font-weight="700" fill="#ffffff" text-anchor="middle">%s</text>
                  <text x="320" y="462" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#111111" text-anchor="middle">%s</text>
                  <text x="320" y="500" font-family="Arial, sans-serif" font-size="20" fill="#666666" text-anchor="middle">%s</text>
                </svg>
                """.formatted(colorAcento, escaparXml(iniciales), escaparXml(marcaNombre), escaparXml(categoriaNombre));

        try {
            Path carpeta = Paths.get("./uploads").toAbsolutePath().normalize();
            Files.createDirectories(carpeta);
            Files.writeString(carpeta.resolve(nombreArchivo), svg, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo generar la imagen de catálogo " + nombreArchivo, e);
        }
        return "/uploads/" + nombreArchivo;
    }

    /** Iniciales cortas a partir del nombre del producto, sin repetir el nombre de la marca. */
    private String iniciales(String nombreProducto, String marcaNombre) {
        String sinMarca = nombreProducto.replaceFirst("(?i)^" + Pattern.quote(marcaNombre) + "\\s+", "");
        StringBuilder resultado = new StringBuilder();
        for (String palabra : sinMarca.split("\\s+")) {
            if (resultado.length() >= 3) break;
            String limpio = palabra.replaceAll("[^A-Za-z0-9]", "");
            if (!limpio.isEmpty()) resultado.append(Character.toUpperCase(limpio.charAt(0)));
        }
        return resultado.length() > 0 ? resultado.toString() : "DS";
    }

    private String escaparXml(String texto) {
        return texto == null ? "" : texto
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    /** Stock pseudo-aleatorio pero determinista: siempre el mismo resultado para la misma semilla. */
    private int[] generarStocks(int semilla, int cantidad) {
        int[] stocks = new int[cantidad];
        for (int i = 0; i < cantidad; i++) {
            int valor = ((semilla * 17 + i * 11) % 23) - 3;
            stocks[i] = Math.max(0, valor);
        }
        return stocks;
    }

    // ------------------------------------------------------------------ usuarios

    private void crearUsuariosDeDemostracion() {
        if (demoPassword == null || demoPassword.length() < 12) {
            throw new IllegalStateException(
                    "DROPSTORE_DEMO_PASSWORD debe tener al menos 12 caracteres cuando DROPSTORE_SEED=true.");
        }
        crearUsuarioSiNoExiste(adminEmail.trim().toLowerCase(), demoPassword, "ADMIN",
                "Administrador", "Drop", "70000001", "987000001");
        crearUsuarioSiNoExiste("almacen@dropstore.local", demoPassword, "ALMACENERO",
                "Lucía", "Quispe", "70000002", "987000002");
        crearUsuarioSiNoExiste("vendedor@dropstore.local", demoPassword, "VENDEDOR",
                "Diego", "Ramos", "70000003", "987000003");
        crearUsuarioSiNoExiste("cliente@dropstore.local", demoPassword, "CLIENTE",
                "Ana", "Torres", "70000004", "987000004");
    }

    private void crearUsuarioSiNoExiste(String correo, String contrasena, String rol,
                                        String nombre, String apellido, String dni, String telefono) {
        if (usuarioRepository.findByCorreo(correo).isPresent()) {
            return;
        }
        Usuario usuario = new Usuario();
        usuario.setCorreo(correo);
        usuario.setContraseña(passwordService.cifrar(contrasena));
        usuario.setRol(rol);
        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setDni(dni);
        usuario.setTelefono(telefono);
        usuario.setDireccion("Jesús María, Lima");
        usuario.setFechacreacion(new Date());
        usuarioRepository.save(usuario);
        log.info("Usuario de demostración creado: {} (rol {})", correo, rol);
    }

    // ------------------------------------------------------------------ catálogo

    private Map<String, marca> crearMarcas(String... nombres) {
        Map<String, marca> resultado = new LinkedHashMap<>();
        for (String nombre : nombres) {
            marca encontrada = marcaRepository.findAll().stream()
                    .filter(existente -> nombre.equalsIgnoreCase(existente.getNombre()))
                    .findFirst()
                    .orElseGet(() -> {
                        marca nueva = new marca();
                        nueva.setNombre(nombre);
                        return marcaRepository.save(nueva);
                    });
            resultado.put(nombre, encontrada);
        }
        return resultado;
    }

    private Map<String, categoria> crearCategorias(String... nombres) {
        Map<String, categoria> resultado = new LinkedHashMap<>();
        for (String nombre : nombres) {
            categoria encontrada = categoriaRepository.findAll().stream()
                    .filter(existente -> nombre.equalsIgnoreCase(existente.getNombre()))
                    .findFirst()
                    .orElseGet(() -> {
                        categoria nueva = new categoria();
                        nueva.setNombre(nombre);
                        return categoriaRepository.save(nueva);
                    });
            resultado.put(nombre, encontrada);
        }
        return resultado;
    }

    private producto crearProducto(String nombre, String modelo, String foto,
                                   double precioCompra, double precioVenta,
                                   categoria cat, String descripcion) {
        producto p = new producto();
        p.setNombre(nombre);
        p.setModelo(modelo);
        p.setFoto(foto);
        p.setPrecio_compra(precioCompra);
        p.setPrcio_venta(precioVenta);
        p.setDescripcion(descripcion);
        p.setCategoria_id(cat);
        return productoRepository.save(p);
    }

    /** Crea una variante (fila de detalle_producto) por cada talla. */
    private void crearTallas(producto p, marca m, String genero, String color,
                             double[] tallas, int[] stocks) {
        for (int i = 0; i < tallas.length; i++) {
            detalle_producto variante = new detalle_producto();
            variante.setProducto(p);
            variante.setMarca(m);
            variante.setGenero(genero);
            variante.setColor(color);
            variante.setTalla(tallas[i]);
            variante.setStock(stocks[i]);
            detalleProductoRepository.save(variante);
        }
    }

}
