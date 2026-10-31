# Cómo trabajamos los cambios

Todo cambio al sistema sigue el mismo camino, para que quede registrado quién lo pidió,
quién lo aprobó, quién lo revisó y cuándo se integró.

## El flujo, paso a paso

1. **Issue.** Se abre una *Solicitud de cambio* (plantilla incluida) con el tipo, el motivo,
   el riesgo y el plan de reversa.
2. **Decisión.** La persona que **no** va a escribir el código responde en un comentario
   «Aprobado» o «Rechazado» con su razón, y pone la etiqueta `aprobado` o `rechazado`.
   Los rechazados se cierran como **Close as not planned**.
3. **Rama.** Una rama por cambio, con el número del issue:
   `infra/12-metricas-actuator`, `app/13-umbral-stock`, `docs/14-matriz-permisos`.
4. **Commits pequeños.** Un commit por idea, con el número del issue:
   `feat(infra): exponer métricas solo para ADMIN (#12)`.
   Prefijos: `feat`, `fix`, `docs`, `test`, `ci`, `chore`.
5. **Pull request.** Se abre contra `main` con «Closes #12» y la plantilla completa.
6. **Revisión.** La otra integrante lo revisa y lo aprueba (**Approve**). Nadie aprueba su
   propio PR.
7. **Merge.** Con *Squash and merge*, solo con el CI en verde. El issue se cierra solo.

## Reglas

- **Cambios pequeños:** un PR hace una sola cosa y se puede revisar en pocos minutos.
- **Nada directo a `main`** una vez activada la protección de la rama.
- **Registro:** si no hay issue, no hay cambio.
- **Reversa:** un cambio se deshace con *Revert* del PR; por eso cada PR debe poder revertirse
  solo.
- **Secretos:** nunca se suben contraseñas ni claves. Van en `secrets.properties`, que Git
  ignora.

## Tipos de cambio

| Etiqueta | Ejemplos |
|---|---|
| `infraestructura` | Configuración del servidor, métricas, base de datos, CI |
| `aplicaciones` | Código del backend o del frontend |
| `documentacion` | README, manuales, comentarios de uso |
| `calendario` | Fechas y ventanas de despliegue (ver `docs/CALENDARIO_CAMBIOS.md`) |

## Solicitudes de servicio

Las peticiones de acceso o de información (no son cambios al sistema) se registran con la
plantilla *Solicitud de servicio* y las etiquetas `solicitud` + `acceso` o `informacion`.
El tiempo de atención es la diferencia entre la fecha de creación y la de cierre del issue.

## Antes de pedir revisión

```bash
# Backend
cd proyecto-analisis/ProyectoTiendaDrop && ./mvnw test

# Frontend
cd proyecto-analisis/Frond-tiendaDrop && npm run lint && npm run build
```
