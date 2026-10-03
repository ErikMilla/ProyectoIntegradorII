# Drop Store — Sistema e-commerce

Sistema de gestión de inventario y ventas para **Drop Store**, tienda de zapatillas urbanas
en Jesús María, Lima.

El objetivo del proyecto es que una venta —hecha en la web o en el mostrador— descuente el
stock en el mismo momento, sin que nadie tenga que actualizar un Excel a mano.

---

## 1. Qué necesitas instalado

| Herramienta | Versión | Cómo comprobar |
|---|---|---|
| **Java JDK** | 17 o superior | `java -version` |
| **Node.js** | 18 o superior | `node -v` |
| **MySQL Server** | 8 o superior | `mysql --version` |

Maven **no** hace falta instalarlo: el proyecto trae su propio wrapper (`mvnw`).

---

## 2. Arrancar el proyecto (primera vez)

### Paso 1 — Enciende MySQL

Solo tiene que estar corriendo. **No hace falta crear la base de datos**: el backend la crea
sola la primera vez, junto con todas sus tablas.

### Paso 2 — Arranca el backend

```bash
cd proyecto-analisis/ProyectoTiendaDrop

# Windows (PowerShell)
$env:DB_PASSWORD="tu_clave_de_mysql"; .\mvnw.cmd spring-boot:run

# Windows (Git Bash) / Linux / macOS
DB_PASSWORD="tu_clave_de_mysql" ./mvnw spring-boot:run
```

Queda escuchando en **http://localhost:8081**.

Si tu MySQL no usa el usuario `root` o no está en el puerto 3306, revisa la tabla de
variables en la sección 4.

### Paso 3 — Arranca el frontend

En **otra terminal**:

```bash
cd proyecto-analisis/Frond-tiendaDrop
npm install     # solo la primera vez
npm run dev
```

Abre **http://localhost:5173**.

---

## 3. Entrar al sistema

Por seguridad, el sistema arranca sin usuarios ni catálogo de demostración. Si necesitas
los datos de muestra, habilítalos expresamente y elige una contraseña de al menos 12
caracteres. En PowerShell:

```powershell
$env:DROPSTORE_SEED="true"
$env:DROPSTORE_DEMO_PASSWORD="Elige-una-clave-segura"
.\mvnw.cmd spring-boot:run
```

Se crearán cuentas de muestra para administrador, almacenero, vendedor y cliente. Todas
usarán la contraseña que acabas de definir. Los datos de ejemplo nunca borran ni reemplazan
información existente.

El segundo factor por correo es obligatorio para administrador y almacenero. Para probarlo
sin un servidor de correo, agrega `$env:MFA_DEV_CODE_ENABLED="true"` antes de arrancar; el
código aparecerá únicamente en la pantalla local. No habilites esta opción en producción.

---

## 4. Configuración

Nada de esto hay que tocarlo para que funcione en local; son los valores por defecto.
Se cambian con variables de entorno, sin editar código.

### Backend

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `DB_HOST` | `localhost` | Servidor de MySQL |
| `DB_PORT` | `3306` | Puerto de MySQL |
| `DB_NAME` | `bd_tiendadrop` | Nombre de la base |
| `DB_USER` | `root` | Usuario de MySQL |
| `DB_PASSWORD` | *(vacío)* | Contraseña de MySQL |
| `SERVER_PORT` | `8081` | Puerto del backend |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origen autorizado para CORS |
| `DROPSTORE_SEED` | `false` | Cargar datos de ejemplo de forma opcional |
| `DROPSTORE_DEMO_PASSWORD` | *(vacío)* | Contraseña segura para las cuentas de muestra |
| `SQL_LOG` | `false` | Mostrar las consultas SQL en consola |
| `MFA_MAIL_ENABLED` | `false` | Enviar los códigos MFA mediante el servidor SMTP configurado |
| `MFA_DEV_CODE_ENABLED` | `false` | Mostrar el código solo para pruebas locales |
| `SMTP_HOST` | `localhost` | Servidor de correo saliente |
| `SMTP_PORT` | `587` | Puerto del servidor de correo |
| `SMTP_USERNAME` | *(vacío)* | Cuenta remitente |
| `SMTP_PASSWORD` | *(vacío)* | Clave o contraseña de aplicación del correo |
| `SMTP_AUTH` | `true` | Activar autenticación SMTP |
| `SMTP_STARTTLS` | `true` | Proteger el envío con STARTTLS |

Para producción, configura las variables `SMTP_*`, activa `MFA_MAIL_ENABLED=true` y deja
`MFA_DEV_CODE_ENABLED=false`. Los códigos duran cinco minutos, solo admiten cinco intentos
y no pueden solicitarse nuevamente durante sesenta segundos.

El cupón de demostración `DROP10` aplica un 10 % antes del IGV. El servidor
valida el código y recalcula el comprobante, tanto en la tienda como en el POS.

El estado del backend puede consultarse en `http://localhost:8081/actuator/health`.
Las evidencias de cumplimiento y rendimiento están en `EVIDENCIAS_REQUISITOS.md`.

### Frontend

Crea un archivo `.env` dentro de `Frond-tiendaDrop/` solo si el backend no está en
`localhost:8081`:

```
VITE_API_URL=http://192.168.1.50:8081
```

---

## 5. Cómo está organizado

```
proyecto-analisis/
├── ProyectoTiendaDrop/        BACKEND  — Spring Boot + MySQL
│   ├── config/                Seguridad, CORS, archivos estáticos, datos de ejemplo
│   ├── controlador/           Endpoints REST (lo que el frontend llama)
│   ├── service/               Reglas de negocio (ventas, stock, contraseñas)
│   ├── Repositorio/           Acceso a la base de datos
│   ├── Modelo/                Entidades = tablas
│   ├── DAO/                   DTOs: lo que entra y sale por la API
│   └── uploads/               Fotos de producto subidas
│
└── Frond-tiendaDrop/          FRONTEND — React + Vite
    └── src/
        ├── pages/             Una página por ruta
        │   └── intranet/      Los tres paneles internos
        ├── components/
        │   ├── shared/        Reutilizados por varios paneles
        │   └── admin/         Exclusivos del administrador
        ├── services/          Llamadas HTTP al backend
        ├── context/           Estado global: sesión y carrito
        └── utils/             Funciones auxiliares
```

### Conceptos que conviene tener claros

**Producto vs. variante.** Un *producto* es el modelo (`Nike Air Force 1 07`). Una
*variante* (`detalle_producto` en la base) es ese modelo en una talla concreta, y **el stock
vive en la variante, no en el producto**. Por eso la API devuelve una fila por talla y el
frontend las agrupa con `agruparPorProducto()` para mostrarlas juntas.

**Cómo compra el cliente.** Catálogo → ficha del producto (`/producto/:id`) → elige talla y
cantidad → carrito → checkout. La talla ya no se elige desde el catálogo: la tarjeta lleva a
la ficha, que es donde están el stock por talla, la descripción y las reseñas.

**Dónde se calculan los totales.** Siempre en el backend
([`VentaServiceImpl`](proyecto-analisis/ProyectoTiendaDrop/src/main/java/com/dropStore/DropStore/service/VentaServiceImpl.java)),
usando los precios guardados en la base. Lo que manda el navegador es solo informativo: si
alguien manipula el precio desde el navegador, no le sirve de nada.

**Qué pasa al vender.** Todo ocurre dentro de una transacción: se crea la venta, se
descuenta el stock de cada talla y se guarda el detalle. Si falta stock de un solo producto,
no se guarda nada.

**Qué pasa al anular.** Las unidades vuelven al inventario automáticamente.

---

## 6. Las rutas de la aplicación

### Tienda (pública)

| Ruta | Qué es |
|---|---|
| `/` | Portada |
| `/catalogo` · `/catalogo/:genero` | Catálogo con filtros de género y marca |
| `/producto/:id` | Ficha del producto: tallas, cantidad y reseñas |
| `/login` · `/registro` | Acceso y alta de clientes |
| `/carrito` | Carrito de compras |
| `/proceso-pago` | Checkout *(requiere sesión)* |

### Intranet

| Ruta | Quién entra |
|---|---|
| `/intranet-admin` | ADMIN |
| `/intranet-almacen` | ADMIN, ALMACENERO |
| `/intranet-vendedor` | ADMIN, VENDEDOR |

Si alguien escribe una de estas rutas sin permiso, el sistema lo devuelve a su propia
pantalla de inicio.

El administrador dispone de la sección **Contenido** dentro de su intranet. Desde allí puede
cambiar la imagen, los textos, el botón, la franja promocional, el enfoque y la altura del
banner de inicio. Se recomiendan imágenes horizontales de 1920 × 900 px en JPG o WEBP.

---

## 7. Endpoints principales

Base: `http://localhost:8081`

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/registro` | Registrar un cliente |
| `GET` | `/api/productos?genero=&marca=` | Variantes del catálogo, con filtros |
| `GET` | `/api/productos/{id}` | Un producto con todas sus tallas |
| `GET` | `/api/contenido-tienda` | Contenido público del banner y la franja promocional |
| `PUT` | `/api/contenido-tienda` | Publicar contenido e imagen *(solo ADMIN; multipart `file` opcional + `data`)* |
| `POST` | `/api/productos` | Crear producto *(multipart: `file` + `data`)* |
| `PUT` · `DELETE` | `/api/productos/{id}` | Editar o eliminar |
| `GET` · `POST` · `PUT` · `DELETE` | `/api/marcas`, `/api/categorias` | Catálogos simples |
| `GET` | `/api/productos/{id}/resenas` | Reseñas del producto y promedio de estrellas |
| `POST` | `/api/productos/{id}/resenas` | Publicar reseña *(una por cliente y producto)* |
| `GET` | `/api/usuarios`, `/api/usuarios/clientes` | Usuarios y clientes |
| `POST` | `/api/v1/ventas` | Registrar venta y descontar stock |
| `GET` | `/api/v1/ventas/todas` | Todas las ventas |
| `GET` | `/api/v1/ventas/{id}` | Venta con su detalle |
| `DELETE` | `/api/v1/ventas/{id}` | Anular y devolver el stock |

---

## 8. Pruebas

```bash
cd proyecto-analisis/ProyectoTiendaDrop
./mvnw test
```

Todas las pruebas corren solas con una base temporal y no necesitan MySQL encendido ni una
contraseña de base de datos.

```bash
cd proyecto-analisis/Frond-tiendaDrop
npm run lint     # revisión de estilo
npm run build    # compilación de producción
```

---

## 9. Problemas frecuentes

**`Access denied for user 'root'@'localhost'`**
La variable `DB_PASSWORD` no coincide con tu MySQL. Arranca así:
`DB_PASSWORD="tu_clave" ./mvnw spring-boot:run`

**El catálogo sale vacío y la consola del navegador muestra errores de red**
El backend no está corriendo, o está en otro puerto. Comprueba con
`curl http://localhost:8081/api/marcas`.

**Las fotos de los productos no cargan**
Las imágenes se sirven desde `ProyectoTiendaDrop/uploads/`. El backend debe arrancarse
desde la carpeta `ProyectoTiendaDrop` para que encuentre esa ruta.

**Creé un cliente desde el panel y no puede iniciar sesión**
Es lo esperado: los clientes creados desde el panel no tienen contraseña. Esa persona debe
ir a `/registro` y registrarse con el mismo correo; el sistema reconoce su cuenta y solo le
añade la contraseña.

**`Port 8081 was already in use`**
Ya hay un backend corriendo. Ciérralo o usa otro puerto con `SERVER_PORT=8082`.

---

## 10. Qué falta por hacer

De los requerimientos acordados, queda únicamente la **búsqueda inteligente en lenguaje
natural (NLP)**, que se desarrollará en la última etapa. Mientras tanto, el buscador
convencional por nombre o modelo ya funciona.

El lector de códigos del POS, la protección del servidor, los permisos por rol y el resto de
los requerimientos están implementados. La disponibilidad del 99 % y la certificación formal
en Safari deben validarse sobre el entorno donde finalmente se despliegue el sistema.

---

## Autores

Milla Tarazona Erik Hugo — U21305410
Clemente Albornoz Kevin Arnold — U22217437

Proyecto Integrador II · Universidad Tecnológica del Perú · 2026
