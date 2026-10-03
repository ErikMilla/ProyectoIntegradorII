const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

/** 459 -> "S/ 459.00" */
export const soles = (valor) => SOLES.format(Number(valor || 0));

/** Número de pedido tal como lo ve el cliente: 12 -> "F-00012". */
export const numeroPedido = (id) => `F-${String(id).padStart(5, '0')}`;

/** Talla sin decimales innecesarios: 40.0 -> "40", 40.5 -> "40.5". */
export const talla = (valor) => String(Number(valor));

/**
 * Resume las tallas con stock de un producto agrupado para la tarjeta:
 * "Agotado", "Solo talla 40" o "Tallas 38–42".
 */
export const resumenTallas = (variantes = []) => {
  const disponibles = variantes
    .filter((variante) => variante.stock > 0)
    .map((variante) => Number(variante.talla))
    .sort((a, b) => a - b);

  if (disponibles.length === 0) return 'Agotado';
  if (disponibles.length === 1) return `Solo talla ${talla(disponibles[0])}`;
  return `Tallas ${talla(disponibles[0])}–${talla(disponibles[disponibles.length - 1])}`;
};
