# Evidencias de cumplimiento — Drop Store

Fecha de verificación: 2 de octubre de 2026.

## Funciones implementadas

| Código | Evidencia disponible |
|---|---|
| RF01 | Registro, inicio y cierre de sesión; perfiles ADMIN, ALMACENERO, VENDEDOR y CLIENTE con permisos comprobados en el servidor. |
| RF02 | Catálogo, productos más vendidos según ventas reales y filtros por género, marca, categoría, precio y talla. La búsqueda NLP queda reservada para la última etapa. |
| RF03 | Carrito, subtotal, cupón `DROP10`, envío, impuestos, comprobante y descuento transaccional de stock. El servidor vuelve a calcular todos los importes. |
| RF04 | POS con cliente, lector USB/entrada manual y cámara mediante BarcodeDetector cuando el navegador lo permite. Existe alternativa manual en navegadores sin esa API. |
| RF05 | Alta, edición y eliminación segura de productos y variantes. Los productos con ventas históricas no pueden destruirse. |
| RF06 | Ventas online y presenciales usan el mismo inventario. Los cambios se notifican a las pantallas abiertas mediante eventos del servidor. |
| RF07 | Listado paginado, búsqueda por comprobante o cliente, rango de fechas, visualización, impresión y anulación con devolución de stock. |
| RF08 | Registro, búsqueda, edición, dirección, resumen e historial detallado de compras por cliente. |
| RF09 | Ingresos, ganancia estimada, descuentos, canales, productos más vendidos, stock y pedidos recientes. Los cálculos agregados se realizan en el servidor. |
| RF10 | Calificaciones y comentarios. El servidor solo permite opinar a quien compró el producto y limita una reseña por cliente y producto. |

## Requisitos de calidad

- **Rendimiento:** 20 consultas consecutivas del catálogo filtrado dieron un promedio de 41.3 ms, p95 de 47.7 ms y máximo de 118.6 ms en el equipo local. El presupuesto solicitado es menor a 3 segundos.
- **Tamaño del frontend:** JavaScript 126.45 kB comprimido y CSS 10.38 kB comprimido en la compilación de producción.
- **Responsive:** existen adaptaciones para móvil, tableta y escritorio. Se corrigió el desbordamiento del buscador y del mensaje del catálogo detectado durante la prueba visual.
- **Disponibilidad:** `/actuator/health`, liveness y readiness permiten que la plataforma de despliegue supervise y reinicie el servicio. El 99 % debe medirse sobre el servidor desplegado; no puede certificarse desde una ejecución local.
- **Seguridad:** sesiones del servidor, permisos por rol, protección CSRF, contraseñas BCrypt, propiedad de pedidos/reseñas y auditoría de dependencias sin vulnerabilidades conocidas.
- **Consistencia:** ventas y anulaciones bloquean cada variante durante el cambio de stock; las operaciones se revierten completas ante un error.
- **Escalabilidad:** facturación está paginada; dashboard y productos más vendidos usan consultas agregadas en lugar de solicitar el detalle de cada venta.
- **Compatibilidad:** verificación visual ejecutada en Chrome y Edge, escritorio y móvil. La cámara dispone de alternativa manual/USB para Firefox y Safari. La certificación formal en Safari debe ejecutarse en macOS.

## Comandos de verificación

```powershell
cd proyecto-analisis/ProyectoTiendaDrop
.\mvnw.cmd test

cd ..\Frond-tiendaDrop
npm run lint
npm run build
npm audit --omit=dev
```

## Pendiente acordado

La búsqueda inteligente en lenguaje natural (NLP) se implementará en la última etapa. La búsqueda convencional por nombre y modelo continúa disponible.
