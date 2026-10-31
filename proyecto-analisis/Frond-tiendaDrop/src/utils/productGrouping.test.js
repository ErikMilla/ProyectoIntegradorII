import { describe, expect, it } from 'vitest';
import { agruparPorProducto } from './productGrouping';

const variante = (id, productoId, talla, marca = 'Nike') => ({
  id,
  talla,
  stock: 3,
  producto: { id: productoId, nombre: `Modelo ${productoId}` },
  marca: marca ? { nombre: marca } : null,
});

describe('agruparPorProducto', () => {
  it('devuelve una lista vacía si no hay variantes', () => {
    expect(agruparPorProducto([])).toEqual([]);
    expect(agruparPorProducto(undefined)).toEqual([]);
  });

  it('junta las tallas de un mismo modelo en un solo producto', () => {
    const resultado = agruparPorProducto([
      variante(1, 7, 40),
      variante(2, 8, 41),
      variante(3, 7, 42),
    ]);

    expect(resultado).toHaveLength(2);
    const modelo7 = resultado.find((producto) => producto.id === 7);
    expect(modelo7.variantes.map((v) => v.id)).toEqual([1, 3]);
  });

  it('ordena las tallas de menor a mayor', () => {
    const [producto] = agruparPorProducto([
      variante(1, 7, 42),
      variante(2, 7, 38),
      variante(3, 7, 40),
    ]);

    expect(producto.variantes.map((v) => v.talla)).toEqual([38, 40, 42]);
  });

  it('ignora las variantes que quedaron sin producto', () => {
    const resultado = agruparPorProducto([
      { id: 1, talla: 40, stock: 1, producto: null },
      variante(2, 7, 41),
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].variantes).toHaveLength(1);
  });

  it('usa la marca de la primera variante o "Sin marca" si no tiene', () => {
    expect(agruparPorProducto([variante(1, 7, 40, 'Adidas')])[0].marcaPrincipal).toBe('Adidas');
    expect(agruparPorProducto([variante(2, 8, 40, null)])[0].marcaPrincipal).toBe('Sin marca');
  });
});
