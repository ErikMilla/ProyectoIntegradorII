import { describe, expect, it } from 'vitest';
import { debeVolverAlCarrito } from './checkout';

describe('debeVolverAlCarrito', () => {
  it('lleva al carrito si se entra a pagar con el carrito vacío', () => {
    expect(debeVolverAlCarrito(0, false)).toBe(true);
  });

  it('no redirige tras una compra terminada, para que se vea la confirmación (INC06)', () => {
    expect(debeVolverAlCarrito(0, true)).toBe(false);
  });

  it('no redirige mientras haya productos', () => {
    expect(debeVolverAlCarrito(2, false)).toBe(false);
    expect(debeVolverAlCarrito(2, true)).toBe(false);
  });
});
