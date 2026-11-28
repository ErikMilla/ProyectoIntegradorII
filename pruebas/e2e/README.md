# Pruebas de punta a punta: CP17, CP18 y CP22

`cp17-cp18-cp22.js` recorre la tienda con Playwright, con tres sesiones a la vez:

| CP | Quién | Qué hace | Qué comprueba |
|---|---|---|---|
| CP18 | Visitante + VENDEDOR | El visitante deja abierta la ficha de Adidas Campus 00s (talla 42). El VENDEDOR vende 1 par en el POS | El backend emite el evento SSE `stock` y la ficha baja 1 unidad **sin recargar** |
| CP22 | VENDEDOR | Busca esa venta en su historial | La fila muestra número, fecha, canal y total, y tiene una acción para abrir o imprimir el comprobante |
| CP17 | CLIENTE | Compra 1 par con la tarjeta de demostración | Ve la confirmación del pedido y lo encuentra en *Mis pedidos* con producto, talla y total |

Al final imprime `Aprobado` o `Falla` por cada comprobación y termina con código 1 si alguna falla.
Guarda capturas (con la franja «Captura automática») y un registro JSON en la carpeta de salida.

## Solo contra una base de prueba

El script **registra ventas y descuenta stock**. Úsalo con el perfil `local` (H2) y una base
nueva con datos de ejemplo, **nunca contra `bd_tiendadrop`**. Una forma de levantarla aparte,
sin tocar la H2 de `./data`:

```powershell
cd proyecto-analisis/ProyectoTiendaDrop
$env:SPRING_PROFILES_ACTIVE = 'local'
$env:SPRING_DATASOURCE_URL  = 'jdbc:h2:file:C:/temp/dropstore-e2e/db;MODE=MySQL;AUTO_SERVER=TRUE'
$env:DROPSTORE_SEED = 'true'
$env:DROPSTORE_DEMO_PASSWORD = Read-Host 'Clave de demostración (12+ caracteres)'
$env:SERVER_PORT = '8083'
$env:DROPSTORE_CORS_ALLOWED_ORIGIN = 'http://localhost:5175'
.\mvnw.cmd spring-boot:run
```

En otra terminal, el frontend apuntando a ese backend:

```powershell
cd proyecto-analisis/Frond-tiendaDrop
$env:VITE_API_URL = 'http://localhost:8083'; npx vite --port 5175 --strictPort
```

## Ejecutar

```powershell
cd pruebas/e2e
npm install
$env:CLAVE_DEMO = '<la misma clave de demostración>'
node cp17-cp18-cp22.js http://localhost:5175 http://localhost:8083 C:\ruta\de\salida
```

La clave solo se lee de `CLAVE_DEMO`; no se guarda en ningún archivo. El script usa las
cuentas que crea la carga de ejemplo: `vendedor@dropstore.local` y `cliente@dropstore.local`.
Espera la variante 242 (Adidas Campus 00s, talla 42) con stock inicial; con una base nueva tiene 8.
