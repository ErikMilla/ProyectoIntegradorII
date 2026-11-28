# Encuesta de usabilidad SUS de Drop Store

Material para medir la usabilidad de la tienda con la escala **SUS** (*System Usability Scale*,
John Brooke, 1986). Solo está preparado: **todavía no hay respuestas ni resultados**.

| Archivo | Para qué sirve |
|---|---|
| [`preguntas.md`](preguntas.md) | Las 10 afirmaciones en español, adaptadas a Drop Store, y cómo pasarlas a Google Forms |
| [`guion-tareas.md`](guion-tareas.md) | Guion para la persona que modera: 3 tareas que cada participante hace **antes** de responder |
| [`plantilla-respuestas.csv`](plantilla-respuestas.csv) | Encabezados para copiar las respuestas (sin filas) |
| [`calcular_sus.py`](calcular_sus.py) | Calcula el puntaje SUS de cada participante y el resumen del grupo |

## Orden de la sesión

1. Leer el consentimiento del formulario y asignar un código de participante (`P01`, `P02`…).
2. Hacer las 3 tareas del guion y anotar en la hoja de observación si cada una se completó.
3. Responder las 10 afirmaciones en Google Forms, justo después de las tareas.
4. Exportar las respuestas a CSV y calcular el puntaje:

```bash
python -X utf8 docs/encuesta-sus/calcular_sus.py respuestas.csv
python -X utf8 docs/encuesta-sus/calcular_sus.py respuestas.csv --salida puntajes.csv
python -X utf8 docs/encuesta-sus/calcular_sus.py --autoprueba   # verifica la fórmula
```

`-X utf8` hace que las tildes se vean bien en la consola de Windows.

El CSV con respuestas **no se sube al repositorio**: queda junto a las demás evidencias.

## Cómo se calcula

Cada afirmación se responde de 1 (*totalmente en desacuerdo*) a 5 (*totalmente de acuerdo*).

- Afirmaciones impares (positivas): aporte = respuesta − 1.
- Afirmaciones pares (negativas): aporte = 5 − respuesta.
- **Puntaje SUS = suma de los 10 aportes × 2,5**, de 0 a 100.

El mismo cálculo en una hoja de cálculo, con las respuestas en las columnas B a K de la fila 2:

```
=((B2-1)+(5-C2)+(D2-1)+(5-E2)+(F2-1)+(5-G2)+(H2-1)+(5-I2)+(J2-1)+(5-K2))*2.5
```

## Cómo leer el resultado

El puntaje **no es un porcentaje**. Referencias publicadas:

- **68** es el promedio de cientos de estudios (Sauro, 2011). Por encima de 68 está sobre el promedio.
- Escala de adjetivos de Bangor, Kortum y Miller (2009), aproximada: alrededor de 51 «aceptable
  con reservas», 71 «bueno», 85 «excelente».

Con pocos participantes el promedio varía mucho. Por eso el script informa también la cantidad de
participantes, la mediana, la desviación estándar, el mínimo y el máximo. Lo reportado debe decir
cuántas personas respondieron.

## Para mantener la validez

- No cambiar el sentido de las afirmaciones ni su orden: la alternancia positiva/negativa es parte
  del método.
- Usar siempre la misma escala de 1 a 5 y que todas sean obligatorias.
- Aplicar la encuesta después de usar la tienda, no antes.
