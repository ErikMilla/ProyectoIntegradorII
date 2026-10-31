# Plan de pruebas de capacidad y rendimiento

Corresponde al **RFC-2026-0003** (issue #17). Explica cómo medir el tiempo de respuesta, la
carga de usuarios y el uso de recursos de Drop Store, y con qué criterio se comparan los
resultados.

## 1. Qué se mide y qué no

| Se mide | No se mide (hay que probarlo aparte) |
|---|---|
| Lectura del catálogo público: `GET /api/productos` | Compras y el POS (escriben y bloquean stock) |
| Tiempo de respuesta p95 y tasa de errores | Inicio de sesión (BCrypt pesa en CPU) |
| CPU, memoria y disco del equipo durante la prueba | Envío de correos (2FA) |

Una prueba de lectura **no demuestra** que el sistema soporte N compradores a la vez. Las cifras
de usuarios son cargas de ensayo, no capacidad garantizada.

## 2. Criterio de aceptación (SLA del informe, tabla 8.3)

| Indicador | Meta |
|---|---|
| Tiempo de respuesta, p95 | ≤ 2 s |
| Errores HTTP | < 1 % |
| CPU o RAM | revisar si pasan de 85 % durante 5 minutos |
| Disco | revisar si el uso pasa de 80 % |
| Disponibilidad | ≥ 99 % mensual: **no se puede certificar en local** |

## 3. Antes de empezar

1. Anota la versión: `git rev-parse --short HEAD`. El ejecutor también la guarda.
2. Usa una **copia de ensayo** de la base y datos de prueba. No midas sobre datos comerciales.
3. Arranca el backend con datos (ver `README.md`, sección 3) y comprueba
   `http://localhost:8081/actuator/health` y `http://localhost:8081/api/productos`.
4. Anota si la prueba usa **MySQL o H2**. La concurrencia de stock (CP19) debe evaluarse en MySQL.
5. Instala **k6** desde su documentación oficial (por ejemplo `winget install k6 --source winget`)
   y comprueba `k6 version`.
6. Cierra programas pesados. Anota el uso de RAM y disco **antes** de medir: si el disco ya
   supera 80 %, el umbral se incumple antes de empezar.
7. Si PowerShell bloquea los scripts, habilítalos solo para esa ventana:
   `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

## 4. Ejecución

Desde la raíz del repositorio, en PowerShell.

**Ensayo corto** (comprueba que todo funciona; sus números no se registran):

```powershell
.\pruebas\ejecutar-escenarios.ps1 -Escenarios 1,10 -Duracion 20s -PausaSegundos 5 -BaseDatos MySQL
```

**Medición completa** (1, 10, 25 y 50 usuarios virtuales, 2 minutos cada uno, con 30 s de
calentamiento y 60 s de pausa entre escenarios):

```powershell
.\pruebas\ejecutar-escenarios.ps1 -BaseDatos MySQL
```

**Comprobar el umbral sostenido de 5 minutos** (un escenario de 2 minutos no lo demuestra):

```powershell
.\pruebas\ejecutar-escenarios.ps1 -Escenarios 50 -Duracion 6m -BaseDatos MySQL
```

El ejecutor:

1. comprueba que el backend esté `UP` y que el catálogo tenga productos;
2. guarda el entorno (equipo, versiones, commit, tamaño de `uploads/`);
3. calienta el servidor 30 s y no registra ese tramo;
4. por cada escenario lanza el muestreo de recursos cada 10 s y corre k6;
5. genera `pruebas/resultados/<fecha-hora>/` con la salida original de k6, la serie temporal de
   recursos y `resumen.csv`.

Para usar solo el muestreo: `.\pruebas\muestreo-recursos.ps1 -Salida recursos.csv`.
Para usar solo k6: `k6 run -e VUS=10 pruebas/k6/catalogo.js`.

### Ensayo sin MySQL (H2 en memoria)

Sirve para practicar. Declara siempre que la base fue H2:

```powershell
cd proyecto-analisis\ProyectoTiendaDrop
$env:SERVER_PORT="8082"; $env:DROPSTORE_SEED="true"; $env:DROPSTORE_DEMO_PASSWORD="Elige-una-clave-segura"
$env:SPRING_DATASOURCE_URL="jdbc:h2:mem:perf;MODE=MySQL;DB_CLOSE_DELAY=-1"
$env:SPRING_DATASOURCE_DRIVER_CLASS_NAME="org.h2.Driver"; $env:SPRING_DATASOURCE_USERNAME="sa"
$env:SPRING_DATASOURCE_PASSWORD=""
.\mvnw.cmd spring-boot:run
# En otra ventana, desde la raíz del repositorio:
.\pruebas\ejecutar-escenarios.ps1 -BaseUrl http://localhost:8082 -BaseDatos "H2 en memoria"
```

## 5. Cómo leer el resultado

`resumen.csv` trae una fila por escenario. Compárala con la sección 2:

| Columna | Se compara con |
|---|---|
| `p95_ms` | ≤ 2000 |
| `Errores_pct` | < 1 |
| `CPU_max_pct`, `RAM_max_pct` | 85 (y que sea sostenido 5 min, no un pico) |
| `Disco_usado_pct` | 80 |
| `Umbrales_k6` | `CUMPLE` si p95 y errores pasaron los umbrales de k6 |

Las columnas `Java_MB`, `MySQL_MB` y `K6_MB` de los CSV de recursos separan quién consume qué.
Suman **todos** los procesos con ese nombre; si el editor tiene procesos `java`, también cuentan.

## 6. Umbrales y acciones si crece la demanda

| Señal | Umbral | Acción |
|---|---|---|
| p95 del catálogo | > 2 s | Paginar `GET /api/productos`, revisar consultas e índices; optimizar imágenes (hoy pesan 42.8 MB). Repetir el mismo escenario |
| Errores HTTP | ≥ 1 % | Revisar logs del backend y el pool de conexiones a la base de datos |
| CPU o RAM | > 85 % durante 5 min | Revisar procesos que consumen recursos antes de ampliar; subir memoria de la JVM o recursos del servidor |
| Disco | > 80 % | Redimensionar y comprimir las fotos de `uploads/`; mover archivos o ampliar el volumen |
| Conexiones a la BD | 10 de 10 en uso | Subir el pool o acortar las transacciones de venta |

El orden es el del informe (11.3.2): primero consultas, imágenes, paginación y procesos
pesados; solo después ampliar infraestructura. Tras cada mejora se repite el mismo escenario.

### Métricas del servidor (opcional)

`/actuator/metrics` (solo ADMIN con sesión) permite consultar `process.cpu.usage`,
`jvm.memory.used`, `hikaricp.connections.active` y `disk.free`. El ADMIN inicia sesión con 2FA,
así que no se automatiza en estos scripts.

## 7. Limitaciones que se declaran en el informe

- El generador de carga (k6) y el servidor comparten equipo: el consumo incluye a los dos.
- Es una prueba de **lectura**; no acredita capacidad de compra, POS, correo ni sesiones.
- Medición local, sin condiciones reales de red ni HTTPS.
- La disponibilidad del 99 % necesita el sistema publicado y un monitor externo.
- Los resultados valen para la versión, el equipo y el volumen de datos que figuran en
  `entorno.txt`.

## 8. Qué se conserva como evidencia (Anexo 27)

Por cada escenario: la salida original de k6 (`.txt` y `.json`), el CSV de recursos y
`entorno.txt`, más las capturas. Una fila de `resumen.csv` equivale a una fila de la tabla A27.
