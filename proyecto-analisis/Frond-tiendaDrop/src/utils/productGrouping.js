/**
 * El backend devuelve una fila por cada talla (lo que en la base se llama
 * detalle_producto). Esta funcion las agrupa por producto para poder mostrar
 * una tarjeta o una fila por modelo, con sus tallas dentro.
 *
 * Entrada:  [ {id:1, talla:40, stock:5, producto:{id:7,...}, marca:{...}}, ... ]
 * Salida:   [ {id:7, ...datos del producto, marcaPrincipal:'Nike', variantes:[...]} ]
 */
export const agruparPorProducto = (detalles) => {
  if (!detalles || detalles.length === 0) return [];

  const agrupados = {};

  detalles.forEach((detalle) => {
    // Si una variante quedo huerfana (sin producto), se ignora.
    if (!detalle.producto || !detalle.producto.id) return;

    const productoId = detalle.producto.id;

    if (!agrupados[productoId]) {
      agrupados[productoId] = {
        ...detalle.producto,
        marcaPrincipal: detalle.marca?.nombre || 'Sin marca',
        variantes: [],
      };
    }

    agrupados[productoId].variantes.push(detalle);
  });

  // Tallas ordenadas de menor a mayor, para que la ficha se lea bien.
  Object.values(agrupados).forEach((producto) => {
    producto.variantes.sort((a, b) => Number(a.talla) - Number(b.talla));
  });

  return Object.values(agrupados);
};
