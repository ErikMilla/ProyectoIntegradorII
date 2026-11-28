"""Puntaje SUS (System Usability Scale) de la encuesta de Drop Store.

Uso:
    python calcular_sus.py respuestas.csv
    python calcular_sus.py respuestas.csv --salida puntajes.csv
    python calcular_sus.py --autoprueba

El CSV puede ser:
  - la plantilla de esta carpeta (columnas participante, p1 ... p10), o
  - la exportación de Google Forms, si cada pregunta empieza con su número
    ("1. Creo que me gustaría...", "2. La tienda me pareció...").

Cada respuesta va de 1 a 5. Impares: respuesta - 1. Pares: 5 - respuesta.
Puntaje = suma x 2,5 (de 0 a 100). Las filas incompletas o con valores fuera
de rango no se calculan y se informan aparte.

Solo usa la biblioteca estándar de Python 3.
"""

import argparse
import csv
import re
import statistics
import sys

PROMEDIO_REFERENCIA = 68  # Sauro (2011)


def puntaje_sus(respuestas):
    """Puntaje SUS de una persona a partir de sus 10 respuestas (enteros de 1 a 5)."""
    if len(respuestas) != 10:
        raise ValueError(f"se esperaban 10 respuestas y hay {len(respuestas)}")
    for numero, valor in enumerate(respuestas, start=1):
        if valor not in (1, 2, 3, 4, 5):
            raise ValueError(f"la respuesta {numero} vale {valor!r}; debe ser un entero de 1 a 5")
    suma = sum((valor - 1) if numero % 2 == 1 else (5 - valor)
               for numero, valor in enumerate(respuestas, start=1))
    return suma * 2.5


def adjetivo_bangor(puntaje):
    """Escala de adjetivos aproximada de Bangor, Kortum y Miller (2009)."""
    if puntaje >= 85:
        return "excelente"
    if puntaje >= 71:
        return "bueno"
    if puntaje >= 51:
        return "aceptable con reservas"
    return "pobre"


def _columnas(encabezados):
    """Ubica la columna del participante y las de las preguntas 1 a 10."""
    preguntas = {}
    for indice, nombre in enumerate(encabezados):
        texto = (nombre or "").strip()
        plantilla = re.fullmatch(r"[pP](\d{1,2})", texto)
        formulario = re.match(r"(\d{1,2})\s*[.)]\s", texto)
        coincidencia = plantilla or formulario
        if coincidencia:
            numero = int(coincidencia.group(1))
            if 1 <= numero <= 10 and numero not in preguntas:
                preguntas[numero] = indice
    faltan = [n for n in range(1, 11) if n not in preguntas]
    if faltan:
        raise SystemExit(f"No se encontraron las columnas de las preguntas {faltan}. "
                         "Usa p1..p10 o títulos que empiecen con '1.', '2.', ...")
    participante = next((i for i, nombre in enumerate(encabezados)
                         if re.search(r"participante|c[oó]digo", nombre or "", re.IGNORECASE)), None)
    return participante, [preguntas[n] for n in range(1, 11)]


def leer_respuestas(ruta):
    """Devuelve (válidas, descartadas) a partir del CSV."""
    with open(ruta, newline="", encoding="utf-8-sig") as archivo:
        filas = list(csv.reader(archivo))
    if not filas:
        raise SystemExit("El archivo está vacío.")
    participante, columnas = _columnas(filas[0])
    validas, descartadas = [], []
    for numero_fila, fila in enumerate(filas[1:], start=2):
        if not any(celda.strip() for celda in fila):
            continue
        codigo = (fila[participante].strip() if participante is not None and participante < len(fila)
                  else "") or f"fila {numero_fila}"
        try:
            respuestas = [int(fila[c].strip()) for c in columnas]
            validas.append((codigo, respuestas, puntaje_sus(respuestas)))
        except (ValueError, IndexError) as error:
            descartadas.append((codigo, str(error) or "faltan respuestas"))
    return validas, descartadas


def resumen(puntajes):
    datos = {
        "participantes": len(puntajes),
        "promedio": statistics.mean(puntajes),
        "mediana": statistics.median(puntajes),
        "minimo": min(puntajes),
        "maximo": max(puntajes),
    }
    datos["desviacion_estandar"] = statistics.stdev(puntajes) if len(puntajes) > 1 else None
    return datos


def autoprueba():
    """Comprueba la fórmula con casos de resultado conocido. No usa respuestas reales."""
    casos = [
        ([3] * 10, 50.0),                        # neutral en todo
        ([5, 1] * 5, 100.0),                     # el mejor patrón posible
        ([1, 5] * 5, 0.0),                       # el peor patrón posible
        ([4, 2, 4, 2, 4, 2, 4, 2, 4, 2], 75.0),  # 3 puntos por pregunta
    ]
    for respuestas, esperado in casos:
        obtenido = puntaje_sus(respuestas)
        assert obtenido == esperado, (respuestas, obtenido, esperado)
    for invalido in ([3] * 9, [0] + [3] * 9, [6] + [3] * 9):
        try:
            puntaje_sus(invalido)
        except ValueError:
            continue
        raise AssertionError(f"debió rechazar {invalido}")
    _, columnas = _columnas(["Marca temporal", "Código de participante"]
                            + [f"{n}. Afirmación {n}" for n in range(1, 11)])
    assert columnas == list(range(2, 12)), columnas
    assert adjetivo_bangor(68) == "aceptable con reservas" and adjetivo_bangor(90) == "excelente"
    print("Autoprueba correcta: fórmula, validación y lectura de columnas.")


def main():
    parser = argparse.ArgumentParser(description="Calcula el puntaje SUS de la encuesta de Drop Store.")
    parser.add_argument("csv", nargs="?", help="CSV con las respuestas")
    parser.add_argument("--salida", help="CSV donde guardar el puntaje de cada participante")
    parser.add_argument("--autoprueba", action="store_true", help="verifica la fórmula y termina")
    args = parser.parse_args()

    if args.autoprueba:
        autoprueba()
        return
    if not args.csv:
        parser.error("indica el CSV de respuestas o usa --autoprueba")

    validas, descartadas = leer_respuestas(args.csv)
    for codigo, motivo in descartadas:
        print(f"Descartada {codigo}: {motivo}", file=sys.stderr)
    if not validas:
        raise SystemExit("No hay respuestas completas para calcular.")

    print("Participante  Puntaje SUS")
    for codigo, _, puntaje in validas:
        print(f"{codigo:<12}  {puntaje:6.1f}")

    datos = resumen([p for _, _, p in validas])
    print()
    print(f"Participantes válidos: {datos['participantes']}"
          + (f" ({len(descartadas)} descartados)" if descartadas else ""))
    print(f"Promedio: {datos['promedio']:.1f} · Mediana: {datos['mediana']:.1f} · "
          f"Mín.: {datos['minimo']:.1f} · Máx.: {datos['maximo']:.1f}")
    if datos["desviacion_estandar"] is not None:
        print(f"Desviación estándar: {datos['desviacion_estandar']:.1f}")
    posicion = "por encima" if datos["promedio"] > PROMEDIO_REFERENCIA else "en o por debajo"
    print(f"Referencia: el promedio publicado es {PROMEDIO_REFERENCIA}; este resultado está {posicion} "
          f"de esa referencia. Adjetivo aproximado (Bangor): {adjetivo_bangor(datos['promedio'])}.")

    if args.salida:
        with open(args.salida, "w", newline="", encoding="utf-8") as archivo:
            escritor = csv.writer(archivo)
            escritor.writerow(["participante"] + [f"p{n}" for n in range(1, 11)] + ["puntaje_sus"])
            for codigo, respuestas, puntaje in validas:
                escritor.writerow([codigo, *respuestas, puntaje])
        print(f"Puntajes guardados en {args.salida}")


if __name__ == "__main__":
    main()
