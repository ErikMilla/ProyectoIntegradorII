# Calendario de cambios

Define **cuándo** se puede desplegar un cambio en Drop Store. Los horarios son hora de Lima
y son una propuesta del equipo; se ajustan cuando se midan las horas reales de menor venta.

## Por qué existe

El sistema vende y descuenta stock en tiempo real. Un despliegue interrumpe el servicio unos
minutos, y el inicio de sesión de ADMIN y ALMACENERO depende del envío de correos (2FA). Por
eso los cambios se hacen cuando hay menos ventas y hay alguien disponible para deshacerlos.

## Ventanas permitidas

| Tipo de cambio | Ventana | Quién debe estar disponible |
|---|---|---|
| Normal (aplicaciones, infraestructura) | Martes y miércoles, 22:00 a 23:59 | Autor y revisor |
| Documentación | Cualquier día (no afecta al servicio) | Autor |
| Emergencia (fallo que impide vender o iniciar sesión) | En cualquier momento | Las dos personas del equipo |

## Periodos congelados

No se despliegan cambios normales en estos periodos:

- Viernes, sábado y domingo.
- Los 3 días anteriores y posteriores a una campaña de ventas.
- Las 24 horas previas a una entrega o sustentación del curso.

## Reglas

1. La fecha propuesta va en el issue de cambio.
2. Una fecha fuera de ventana es motivo de **rechazo**, salvo que sea una emergencia.
3. Todo despliegue debe tener plan de reversa y el CI en verde.
4. Si un cambio falla, se revierte primero y se investiga después.
5. Las emergencias se registran igual: issue, PR y revisión, aunque sea después del hecho.
