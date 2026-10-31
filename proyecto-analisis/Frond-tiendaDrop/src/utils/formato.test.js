import { describe, expect, it } from 'vitest';
import { numeroPedido, resumenTallas, soles, talla } from './formato';

// Intl separa el símbolo y el número con un espacio no separable; se normaliza.
const normalizar = (texto) => texto.replace(/\s/g, ' ');

describe('soles', () => {
  it('da formato de moneda peruana', () => {
    expect(normalizar(soles(459))).toBe('S/ 459.00');
    expect(normalizar(soles('1234.5'))).toBe('S/ 1,234.50');
  });

  it('trata un valor vacío como cero', () => {
    expect(normalizar(soles(undefined))).toBe('S/ 0.00');
    expect(normalizar(soles(null))).toBe('S/ 0.00');
  });
});

describe('numeroPedido', () => {
  it('rellena con ceros hasta cinco cifras', () => {
    expect(numeroPedido(12)).toBe('F-00012');
    expect(numeroPedido(123456)).toBe('F-123456');
  });
});

describe('talla', () => {
  it('quita los decimales innecesarios', () => {
    expect(talla(40.0)).toBe('40');
    expect(talla(40.5)).toBe('40.5');
    expect(talla('42')).toBe('42');
  });
});

describe('resumenTallas', () => {
  it('dice "Agotado" cuando ninguna talla tiene stock', () => {
    expect(resumenTallas([{ talla: 40, stock: 0 }])).toBe('Agotado');
    expect(resumenTallas()).toBe('Agotado');
  });

  it('nombra la talla cuando solo queda una', () => {
    expect(resumenTallas([{ talla: 40, stock: 2 }, { talla: 41, stock: 0 }])).toBe('Solo talla 40');
  });

  it('muestra el rango cuando hay varias tallas con stock', () => {
    const variantes = [
      { talla: 42, stock: 1 },
      { talla: 38, stock: 4 },
      { talla: 40, stock: 2 },
      { talla: 44, stock: 0 },
    ];

    expect(resumenTallas(variantes)).toBe('Tallas 38–42');
  });
});
