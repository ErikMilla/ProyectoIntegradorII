import { describe, expect, it } from 'vitest';
import { coincideColor, coincideTexto, normalizar, raiz } from './busqueda';

const airForce = {
  nombre: 'Nike Air Force 1 07',
  modelo: 'AF1-07-WHT',
  marcaPrincipal: 'Nike',
  categoria_id: { nombre: 'Urbano' },
};

describe('normalizar', () => {
  it('quita tildes, mayúsculas y signos', () => {
    expect(normalizar('  Niños, ¡ÉPICAS!  ')).toBe('ninos epicas');
  });
});

describe('raiz', () => {
  it('iguala género y número', () => {
    expect(raiz('blancas')).toBe(raiz('blanco'));
    expect(raiz('azules')).toBe(raiz('azul'));
    expect(raiz('grises')).toBe(raiz('gris'));
  });
});

describe('coincideTexto', () => {
  it('encuentra las palabras en cualquier orden y sin tildes', () => {
    expect(coincideTexto(airForce, 'force AIR')).toBe(true);
    expect(coincideTexto(airForce, 'urbano')).toBe(true);
  });

  it('exige todas las palabras', () => {
    expect(coincideTexto(airForce, 'air jordan')).toBe(false);
  });

  it('un texto vacío no filtra', () => {
    expect(coincideTexto(airForce, '')).toBe(true);
  });
});

describe('coincideColor', () => {
  it('reconoce un color dentro de una combinación', () => {
    expect(coincideColor('Blanco/Negro', 'Blanco')).toBe(true);
    expect(coincideColor('Blanca', 'Blanco')).toBe(true);
  });

  it('descarta otros colores y variantes sin color', () => {
    expect(coincideColor('Lila', 'Blanco')).toBe(false);
    expect(coincideColor(null, 'Blanco')).toBe(false);
  });
});
