import { describe, expect, it } from 'vitest';
import { generosIncluidos } from './genero';

describe('generosIncluidos', () => {
  it('Hombre y Mujer incluyen los modelos Unisex', () => {
    expect(generosIncluidos('Hombre')).toEqual(['Hombre', 'Unisex']);
    expect(generosIncluidos('Mujer')).toEqual(['Mujer', 'Unisex']);
  });

  it('Niños y Unisex solo traen su propio género', () => {
    expect(generosIncluidos('Niños')).toEqual(['Niños']);
    expect(generosIncluidos('Unisex')).toEqual(['Unisex']);
  });
});
