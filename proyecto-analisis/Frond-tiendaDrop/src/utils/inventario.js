/**
 * Criterio único de "stock bajo" para todo el frontend.
 *
 * Antes este número estaba repetido en tres pantallas (Dashboard, Alertas de
 * stock y Reportes). Cambiarlo aquí cambia las tres a la vez.
 */

/** Con 5 unidades o menos se considera stock bajo (incluye agotado). */
export const UMBRAL_STOCK_BAJO = 5;

/**
 * Indica si una cantidad de unidades es stock bajo.
 * Se aplica a una talla (Dashboard, Alertas) o al total de un modelo (Reportes).
 */
export const esStockBajo = (unidades) => Number(unidades) <= UMBRAL_STOCK_BAJO;
