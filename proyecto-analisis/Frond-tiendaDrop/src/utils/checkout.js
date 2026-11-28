/**
 * ¿Hay que sacar al cliente de la pantalla de pago y llevarlo al carrito?
 *
 * Solo cuando el carrito está vacío porque nunca tuvo productos (por ejemplo,
 * entró a /proceso-pago escribiendo la dirección). Si se vació porque la
 * compra acaba de terminar, no: en ese momento va a /orden-confirmada y
 * redirigirlo al carrito le ocultaría la confirmación (INC06).
 */
export const debeVolverAlCarrito = (cantidadProductos, compraTerminada) => (
  cantidadProductos === 0 && !compraTerminada
);
