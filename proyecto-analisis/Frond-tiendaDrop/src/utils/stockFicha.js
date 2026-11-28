/**
 * Talla que debe quedar elegida en la ficha cuando llega un aviso de stock
 * y se vuelven a pedir las variantes (INC07).
 *
 * Se respeta la elección del visitante aunque se haya agotado: así ve que
 * esa talla ya no tiene stock, en lugar de que la pantalla cambie de talla
 * sola. Solo si la variante desapareció se elige la primera con stock.
 */
export const varianteTrasActualizar = (variantes, seleccionadaId) => {
  if (variantes.some((variante) => variante.id === seleccionadaId)) return seleccionadaId;
  const disponible = variantes.find((variante) => variante.stock > 0);
  return disponible ? disponible.id : null;
};
