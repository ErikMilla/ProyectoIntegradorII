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

### Paso 1 — Enciende MySQL y crea el usuario de la aplicación

El backend **no** se conecta como `root`: usa `dropstore_app`, que solo tiene permisos sobre
`bd_tiendadrop` (mínimo privilegio, INC02). Créalo una sola vez entrando a MySQL como `root`
(Workbench o `mysql -u root -p`) y cambia la clave de ejemplo por una tuya:

```sql
CREATE DATABASE IF NOT EXISTS bd_tiendadrop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'dropstore_app'@'localhost' IDENTIFIED BY 'cambia_esta_clave';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON bd_tiendadrop.* TO 'dropstore_app'@'localhost';
```

`CREATE`, `ALTER`, `INDEX` y `REFERENCES` hacen falta porque Hibernate (`ddl-auto=update`)
crea y actualiza las tablas al arrancar. Las tablas no hace falta crearlas a mano.

### Paso 2 — Arranca el backend

```bash
cd proyecto-analisis/ProyectoTiendaDrop

# Windows (PowerShell)
$env:DB_PASSWORD="clave_de_dropstore_app"; .\mvnw.cmd spring-boot:run

# Windows (Git Bash) / Linux / macOS
DB_PASSWORD="clave_de_dropstore_app" ./mvnw spring-boot:run
```

Para no escribir la clave cada vez ni dejarla en el historial de la terminal, guárdala una
vez como variable de usuario (ver *Credenciales de la base de datos* en la sección 4).

Queda escuchando en **http://localhost:8081**.

Si tu MySQL no está en `localhost:3306` o usas otro usuario, revisa la tabla de variables en
la sección 4.

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
| `DB_USER` | `dropstore_app` | Usuario de MySQL de la aplicación, con permisos solo sobre `bd_tiendadrop` (sección 2, paso 1). No uses `root` |
| `DB_PASSWORD` | *(vacío)* | Contraseña de `DB_USER` |
| `SERVER_PORT` | `8081` | Puerto del backend |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origen autorizado para CORS |
| `SESSION_COOKIE_SECURE` | `false` | Enviar la cookie de sesión solo por HTTPS. Ponla en `true` en producción |
| `DROPSTORE_SEED` | `false` | Cargar datos de ejemplo de forma opcional |
| `DROPSTORE_DEMO_PASSWORD` | *(vacío)* | Contraseña segura para las cuentas de muestra |
| `DROPSTORE_ADMIN_EMAIL` | `admin@dropstore.local` | Correo de la cuenta administradora que crea la carga de ejemplo |
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

#### Credenciales de la base de datos

En el equipo donde corre la tienda, guarda `DB_USER` y `DB_PASSWORD` como variables de usuario
de Windows. Desde PowerShell, la clave se pide sin mostrarla en pantalla y no queda en el
historial:

```powershell
[Environment]::SetEnvironmentVariable('DB_USER', 'dropstore_app', 'User')
$clave = Read-Host 'Clave de dropstore_app' -AsSecureString
[Environment]::SetEnvironmentVariable('DB_PASSWORD',
    [Net.NetworkCredential]::new('', $clave).Password, 'User')
Remove-Variable clave
```

Cierra y vuelve a abrir la terminal (o VS Code) para que el backend las vea.

Si existe `ProyectoTiendaDrop/secrets.properties` (Git lo ignora), **sus valores mandan sobre
las variables**: una línea `spring.datasource.password=` ahí deja sin efecto `DB_PASSWORD`.
Bórrala, o guarda allí `spring.datasource.username` y `spring.datasource.password`, pero no las
dos cosas a la vez.

Los scripts de respaldo y restauración (`scripts/`) son tareas de administración: usan
`BACKUP_DB_USER` (por defecto `root`) y no `DB_USER`, porque `dropstore_app` no puede crear
bases ni leer los triggers.

El estado del backend puede consultarse en `http://localhost:8081/actuator/health`.
Las métricas del servidor (CPU, memoria, disco y conexiones a la base de datos) están en
`/actuator/metrics`, y solo las ve un ADMIN con sesión iniciada.
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

Módulos que ve cada rol dentro de su pantalla:

| Rol | Módulos |
|---|---|
| ADMIN | Dashboard, Usuarios, Facturación, Inventario, Clientes, Punto de venta, Reportes, Contenido y Configuración |
| ALMACENERO | Alertas de stock, Inventario y Reportes (sin la pestaña Clientes) |
| VENDEDOR | Punto de venta, Clientes e Historial de ventas |
| CLIENTE | La tienda: catálogo, carrito, pago y *Mis pedidos* (`/mis-pedidos`) |

Qué puede hacer cada rol en el servidor está en la matriz de la sección 7.

El administrador dispone de la sección **Contenido** dentro de su intranet. Desde allí puede
cambiar la imagen, los textos, el botón, la franja promocional, el enfoque y la altura del
banner de inicio. Se recomiendan imágenes horizontales de 1920 × 900 px en JPG o WEBP.

---

## 7. Endpoints principales

Base: `http://localhost:8081`

La columna **Acceso** dice quién puede llamar al endpoint (lo comprueba el servidor, no la
pantalla). «Sesión» significa cualquier usuario que haya iniciado sesión.

### Sesión y seguridad

| Método | Ruta | Qué hace | Acceso |
|---|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión. ADMIN y ALMACENERO reciben un código por correo (2FA) | Público |
| `POST` | `/api/auth/mfa/verificar` | Confirmar el código 2FA y abrir la sesión | Público |
| `POST` | `/api/auth/mfa/reenviar` | Pedir otro código 2FA (una vez cada 60 s) | Público |
| `POST` | `/api/auth/registro` | Registrar un cliente | Público |
| `POST` | `/api/auth/registro/verificar` | Confirmar el registro con el código de 6 dígitos | Público |
| `POST` | `/api/auth/registro/reenviar` | Reenviar el código del registro | Público |
| `GET` | `/api/auth/csrf` | Token CSRF, que debe enviarse en las peticiones que modifican datos | Público |
| `GET` | `/api/auth/verificar` | Datos de la sesión actual | Sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión | Sesión |

### Catálogo y tienda

| Método | Ruta | Qué hace | Acceso |
|---|---|---|---|
| `GET` | `/api/productos?genero=&marca=` | Variantes del catálogo, con filtros | Público |
| `GET` | `/api/productos/{id}` | Un producto con todas sus tallas | Público |
| `GET` | `/api/productos/mas-vendidos` | Los 8 productos más vendidos, según ventas reales | Público |
| `GET` | `/api/productos/interpretar?q=` | Convierte una frase en filtros del catálogo *(búsqueda en lenguaje natural, máx. 200 caracteres)* | Público |
| `POST` | `/api/productos` | Crear producto *(multipart: `file` + `data`)* | ADMIN, ALMACENERO |
| `PUT` · `DELETE` | `/api/productos/{id}` | Editar o eliminar | ADMIN, ALMACENERO |
| `GET` | `/api/marcas`, `/api/categorias` | Catálogos simples | Público |
| `POST` · `PUT` · `DELETE` | `/api/marcas`, `/api/categorias` | Crear, editar o eliminar | ADMIN, ALMACENERO |
| `GET` | `/api/contenido-tienda` | Contenido público del banner y la franja promocional | Público |
| `PUT` | `/api/contenido-tienda` | Publicar contenido e imagen *(multipart `file` opcional + `data`)* | ADMIN |
| `GET` | `/api/stock/eventos` | Eventos en tiempo real: avisa a las pantallas abiertas cuando cambia el stock *(el navegador solo la mantiene abierta en la pestaña visible; al volver, la pantalla recarga)* | Público |
| `GET` | `/api/productos/{id}/resenas` | Reseñas del producto y promedio de estrellas | Público |
| `POST` | `/api/productos/{id}/resenas` | Publicar reseña *(una por cliente y producto, solo compradores)* | CLIENTE |
| `DELETE` | `/api/productos/{id}/resenas/{resenaId}` | Borrar una reseña *(el autor o ADMIN)* | Con sesión; el controlador solo deja al autor o a ADMIN |

### Ventas

| Método | Ruta | Qué hace | Acceso |
|---|---|---|---|
| `POST` | `/api/v1/ventas` | Registrar venta y descontar stock. Si quien la hace es CLIENTE, queda a su nombre | ADMIN, VENDEDOR, CLIENTE |
| `GET` | `/api/v1/ventas/todas` | Todas las ventas | ADMIN, ALMACENERO, VENDEDOR |
| `GET` | `/api/v1/ventas/pagina?page=&size=&q=&desde=&hasta=` | Ventas paginadas, con búsqueda por comprobante o cliente y rango de fechas (máximo 100 por página) | ADMIN, ALMACENERO, VENDEDOR |
| `GET` | `/api/v1/ventas/reportes/resumen` | Indicadores del dashboard y de reportes | ADMIN, ALMACENERO, VENDEDOR |
| `GET` | `/api/v1/ventas/usuario/{id}` | Pedidos de un usuario | Sesión (CLIENTE solo los suyos) |
| `GET` | `/api/v1/ventas/{id}` | Venta con su detalle | ADMIN, ALMACENERO, VENDEDOR; CLIENTE solo las suyas |
| `DELETE` | `/api/v1/ventas/{id}` | Anular y devolver el stock | ADMIN |

### Usuarios

| Método | Ruta | Qué hace | Acceso |
|---|---|---|---|
| `GET` | `/api/usuarios` | Listar todos los usuarios | ADMIN |
| `GET` | `/api/usuarios/clientes` | Listar los clientes | ADMIN, VENDEDOR |
| `POST` | `/api/usuarios` | Crear un usuario. El VENDEDOR solo puede crear clientes, sin acceso web | ADMIN, VENDEDOR |
| `PUT` · `DELETE` | `/api/usuarios/{id}` | Editar (incluido el rol) o eliminar | ADMIN |

### Monitoreo

| Método | Ruta | Qué hace | Acceso |
|---|---|---|---|
| `GET` | `/actuator/health` | Estado del servicio (`UP` o `DOWN`); también `/actuator/health/liveness` y `/actuator/health/readiness` | Público |
| `GET` | `/actuator/metrics` y `/actuator/metrics/{nombre}` | CPU, memoria, disco, conexiones a la base de datos y latencias. Por ejemplo `process.cpu.usage` | ADMIN |

### Quién puede hacer qué

Matriz de permisos por rol. Las reglas las aplica el servidor: por ruta en
[`SecurityConfig`](proyecto-analisis/ProyectoTiendaDrop/src/main/java/com/dropStore/DropStore/config/SecurityConfig.java)
y, para «solo lo suyo», dentro de los controladores. La pantalla únicamente oculta botones.
Contrastada con ese código el 31 de octubre de 2026.

| Acción | Sin sesión | CLIENTE | VENDEDOR | ALMACENERO | ADMIN |
|---|:-:|:-:|:-:|:-:|:-:|
| Ver catálogo, fichas, reseñas y banner | Sí | Sí | Sí | Sí | Sí |
| Segundo factor (2FA) por correo al iniciar sesión | — | No | No | **Sí** | **Sí** |
| Comprar en la tienda (carrito y pago) | No | Sí | Sí | No | Sí |
| Ver una venta o sus pedidos | No | Solo los suyos | Sí | Sí | Sí |
| Registrar ventas en el POS | No | No | Sí | No | Sí |
| Ver todas las ventas, facturación y reportes | No | No | Sí | Sí | Sí |
| Anular una venta | No | No | No | No | Sí |
| Publicar una reseña de un producto comprado | No | Sí | No | No | No |
| Borrar una reseña | No | Solo las suyas | No | No | Sí |
| Crear, editar y eliminar productos, marcas y categorías | No | No | No | Sí | Sí |
| Ver y registrar clientes | No | No | Sí | No | Sí |
| Crear usuarios con otro rol, cambiar roles y eliminar usuarios | No | No | No | No | Sí |
| Editar el contenido del banner de la tienda | No | No | No | No | Sí |
| Ver las métricas del servidor | No | No | No | No | Sí |

**Principio de mínimo privilegio.** Cada rol solo recibe lo que necesita para su trabajo. Por
ejemplo, el ALMACENERO ve ventas y reportes para controlar el inventario, pero no puede ver ni
registrar clientes, y por eso la pestaña *Clientes* de Reportes no aparece en su pantalla.

**Reseñas (INC01, #27).** Las reglas de reseñas van en `SecurityConfig` antes de las de
`/api/productos/**`, que antes también las alcanzaban y devolvían **403** al CLIENTE. Las cubre
[`ResenaSecurityTest`](proyecto-analisis/ProyectoTiendaDrop/src/test/java/com/dropStore/DropStore/controlador/ResenaSecurityTest.java).

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
npm test         # pruebas automáticas (Vitest)
npm run build    # compilación de producción
```

Cada push y cada pull request ejecutan estas mismas comprobaciones en GitHub Actions
(`.github/workflows/ci.yml`).

Para medir el rendimiento y la capacidad (k6 y registro de CPU, memoria y disco) sigue el
[plan de pruebas de capacidad](docs/PLAN_PRUEBAS_CAPACIDAD.md); los scripts están en
`pruebas/`.

---

## 9. Problemas frecuentes

**`Access denied for user 'dropstore_app'@'localhost'`**
Falta crear el usuario (sección 2, paso 1) o `DB_PASSWORD` no coincide con su clave. Revisa
también que `secrets.properties` no tenga otra `spring.datasource.password`, porque esa manda.
Arranca así: `DB_PASSWORD="clave_de_dropstore_app" ./mvnw spring-boot:run`

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

Todos los requerimientos acordados están implementados, incluida la **búsqueda en lenguaje
natural (NLP)**. El buscador acepta frases como *"zapatillas Nike blancas para mujer talla 38
de menos de 400 soles"*. `GET /api/productos/interpretar` las convierte en los filtros del
catálogo: género, marca, categoría, color, talla, rango de precio y orden. Las palabras que
no encajan en ningún filtro se buscan en el nombre, modelo y marca. El catálogo muestra lo
que entendió ("Entendimos … como Mujer · Nike · Blanco · Talla 38 · Hasta S/ 400") y cada
filtro aparece como un chip que se puede quitar.

El intérprete (`InterpreteConsulta`) funciona por reglas y sin servicios externos: normaliza
tildes y plurales ("blancas" → Blanco, "urbanas" → Urbano) y toma las marcas, categorías y
colores de la base de datos, así que una marca nueva se reconoce sin tocar código. No usa un
modelo de lenguaje, por lo que no entiende sinónimos fuera de su vocabulario ni frases
ambiguas. Si menciona dos valores del mismo filtro ("nike o adidas"), ese filtro no se aplica.

El lector de códigos del POS, la protección del servidor, los permisos por rol y el resto de
los requerimientos también están implementados. La disponibilidad del 99 % y la certificación formal
en Safari deben validarse sobre el entorno donde finalmente se despliegue el sistema.

---

## Autores

Milla Tarazona Erik Hugo — U21305410
Clemente Albornoz Kevin Arnold — U22217437

Proyecto Integrador II · Universidad Tecnológica del Perú · 2026
