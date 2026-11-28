/**
 * Un modelo Unisex también es para hombre y para mujer. Es la misma regla que
 * aplica el backend en GET /productos?genero=, para que los totales de la
 * portada coincidan con lo que muestra el catálogo.
 */
export const generosIncluidos = (genero) => (
  genero === 'Hombre' || genero === 'Mujer' ? [genero, 'Unisex'] : [genero]
);
