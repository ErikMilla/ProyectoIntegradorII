import { describe, expect, it } from 'vitest';
import { UMBRAL_STOCK_BAJO, esStockBajo } from './inventario';

describe('criterio de stock bajo', () => {
  it('el umbral es de 5 unidades', () => {
    expect(UMBRAL_STOCK_BAJO).toBe(5);
  });

  it('considera bajo el stock igual o menor al umbral, incluido el agotado', () => {
    expect(esStockBajo(0)).toBe(true);
    expect(esStockBajo(3)).toBe(true);
    expect(esStockBajo(UMBRAL_STOCK_BAJO)).toBe(true);
  });

  it('no considera bajo el stock por encima del umbral', () => {
    expect(esStockBajo(UMBRAL_STOCK_BAJO + 1)).toBe(false);
    expect(esStockBajo(40)).toBe(false);
  });

  it('acepta cantidades que llegan como texto desde la API o formularios', () => {
    expect(esStockBajo('4')).toBe(true);
    expect(esStockBajo('12')).toBe(false);
  });

  it('un valor ausente no se marca como stock bajo', () => {
    expect(esStockBajo(undefined)).toBe(false);
  });
});
