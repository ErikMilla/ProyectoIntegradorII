import { describe, expect, it } from 'vitest';
import { varianteTrasActualizar } from './stockFicha';

const variantes = [
  { id: 240, talla: 40, stock: 9 },
  { id: 242, talla: 42, stock: 7 },
  { id: 243, talla: 43, stock: 0 },
];

describe('varianteTrasActualizar', () => {
  it('mantiene la talla elegida cuando su stock cambia', () => {
    expect(varianteTrasActualizar(variantes, 242)).toBe(242);
  });

  it('mantiene la talla elegida aunque se haya agotado, para que el visitante lo vea', () => {
    expect(varianteTrasActualizar(variantes, 243)).toBe(243);
  });

  it('si la variante ya no existe, elige la primera con stock', () => {
    expect(varianteTrasActualizar(variantes, 999)).toBe(240);
  });

  it('si no queda ninguna con stock, no elige ninguna', () => {
    expect(varianteTrasActualizar([{ id: 1, stock: 0 }], 999)).toBeNull();
  });
});
