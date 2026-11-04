# Campaña «Navidad a tu estilo» — piloto académico

**Cambio relacionado:** [RFC-2026-0001, issue #16](https://github.com/ErikMilla/ProyectoIntegradorII/issues/16).

**Documento preparado:** 4 de noviembre de 2026. Pruebas locales realizadas el 2 de noviembre de 2026.

## 1. Estado y alcance

Se preparó el banner y se comprobó el cupón DROP10 en el sistema local de Drop Store. La aprobación técnica consta en el issue #16. La aprobación comercial de la tienda y el lanzamiento público siguen pendientes; este documento no los sustituye.

El piloto utiliza compras simuladas. No acredita cobros reales, emisión tributaria ante SUNAT ni una campaña comercial publicada en Internet. La revisión de este documento por el otro integrante del equipo y la incorporación de las evidencias al issue se registrarán antes del cierre técnico.

## 2. Productos y disponibilidad

- Referencia comprobada para el cupón: Nike Air Force 1 07, talla 40, una unidad, con precio de S/ 459,00 en la ejecución del piloto.
- Producto exclusivo de prueba de concurrencia: «Producto de prueba CP26», talla 40, precio S/ 100,00 y stock inicial de una unidad. Finalizó con stock cero; no debe presentarse como producto disponible de campaña.
- La selección comercial definitiva de productos y tallas participantes está pendiente. El stock comprobado el 2 de noviembre no garantiza disponibilidad posterior.
- Antes de cualquier lanzamiento se debe revisar nuevamente el inventario por talla y aprobar la selección comercial. La imagen del banner por sí sola no demuestra que todos los modelos representados participen o tengan stock.

## 3. Condiciones de la propuesta

- Nombre: «Navidad a tu estilo».
- Cupón: **DROP10**.
- Descuento comprobado: **10 % sobre el subtotal, antes del IGV**.
- El envío se calcula por separado. El descuento no equivale a envío gratuito.
- IGV utilizado en el piloto: 18 % sobre la base después del descuento.
- En las compras documentadas, el envío fue de S/ 17,00; no se presenta como tarifa universal para cualquier destino.
- Vigencia comercial propuesta: del **1 al 24 de diciembre de 2026**, sujeta a aprobación de la tienda.
- La prueba del cupón del 2 de noviembre fue una prueba técnica fuera de esa vigencia propuesta. No demuestra que el servidor restrinja automáticamente el cupón a las fechas comerciales; esa condición debe verificarse o configurarse antes del lanzamiento.
- Productos participantes, condiciones definitivas y comunicaciones externas requieren aprobación comercial.

Texto de referencia para condiciones visibles:

> Cupón DROP10: 10 % de descuento sobre el subtotal antes del IGV. Envío calculado por separado. Productos participantes según disponibilidad por talla. Vigencia propuesta: del 1 al 24 de diciembre de 2026, sujeta a aprobación comercial.

## 4. Configuración del banner

Se cargó la imagen de campaña desde el módulo administrativo de contenido y se comprobó su visualización local. La imagen ya contiene los textos promocionales; se retiró la superposición de textos HTML en la versión local utilizada en las capturas, para evitar duplicarlos.

Se verificó el enlace al catálogo y se revisó la visualización en escritorio y en anchos móviles, incluido 390 px. En móvil se mostraron condiciones legibles debajo del banner. Estas comprobaciones corresponden al entorno local; no certifican un despliegue público ni que todas las modificaciones visuales locales estén incorporadas a `main`.

## 5. Resultados de las pruebas

| Caso | Comprobación local | Resultado documentado |
|---|---|---|
| CP24 | Cupón DROP10 con producto y stock | Subtotal S/ 459,00; descuento S/ 45,90; base S/ 413,10; IGV S/ 74,36; envío S/ 17,00; total S/ 504,46. Comprobante interno F-00005. |
| CP25 | Cupón INVALIDO123 | La interfaz indicó que el cupón no existe o venció. No se documentó una compra adicional para este caso. |
| CP26 | Dos sesiones intentaron comprar la última unidad | Una solicitud obtuvo HTTP 201 y otra HTTP 400 por stock insuficiente. Se registró un comprobante interno F-00007 y el stock final fue cero. |
| CP27 | Banner, condiciones y navegación | Se comprobó el banner local en escritorio y móvil, las condiciones legibles y el enlace al catálogo. |

En CP26, el total fue S/ 123,20: subtotal S/ 100,00, descuento S/ 10,00, IGV S/ 16,20 y envío S/ 17,00. Las dos sesiones fueron operadas por un integrante. Es una ejecución de prueba y no un estudio repetido de carga de compras ni una inspección de los bloqueos internos de la base de datos.

Las capturas y registros de estas pruebas se incorporarán como evidencias al issue #16. No se incluyen credenciales ni códigos de verificación en este documento.

## 6. Retiro y retorno

Si se detecta un mensaje incorrecto, un enlace roto o una diferencia en el descuento:

1. Suspender el uso promocional del banner y recuperar el contenido anterior desde el módulo administrativo, conservando una copia previa de imagen y textos.
2. Verificar el enlace al catálogo y las condiciones visibles en escritorio y móvil.
3. Si procede retirar o desactivar el cupón, hacerlo mediante el mecanismo autorizado disponible y comprobar que ya no se aplica. Retirar la imagen no desactiva por sí mismo el cupón.
4. Registrar el motivo, la hora, la acción y la comprobación final en el issue.
5. Si debe retirarse este documento del repositorio, revertir el cambio correspondiente tras la revisión del equipo.

La meta propuesta de retorno es de 30 minutos; no se midió su cumplimiento. Al finalizar una eventual campaña comercial debe aplicarse también el retiro programado de la promoción y verificarse el comportamiento del cupón.

## 7. Revisión posterior y pendientes

- Preparación adelantada respecto a la planificación original del 16 al 22 de noviembre de 2026; las pruebas documentadas se realizaron el 2 de noviembre.
- No se registró desembolso técnico de campaña. Las horas efectivas no se midieron.
- Lecciones: evitar textos duplicados sobre imágenes que ya los contienen; separar el descuento del envío; comprobar stock por talla antes de promocionar.
- Pendientes técnicos de registro: revisión del otro integrante, incorporación de este documento al repositorio y publicación de las evidencias y conclusión en #16.
- Pendientes comerciales: aprobación de condiciones y fechas, selección definitiva de productos, verificación de vigencia efectiva del cupón y autorización del lanzamiento.

El cierre técnico debe expresar este alcance y conservar visibles los pendientes comerciales; no debe presentarse como autorización de una campaña real.

## 8. Referencias

- [Issue #16: alcance y aprobación técnica](https://github.com/ErikMilla/ProyectoIntegradorII/issues/16).
- [SOL02, issue #20: condiciones del cupón](https://github.com/ErikMilla/ProyectoIntegradorII/issues/20).
- Informe académico y capturas de las ejecuciones locales del 2 de noviembre de 2026.
