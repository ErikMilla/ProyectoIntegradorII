/**
 * Coincidencias del buscador del catálogo.
 *
 * El backend (/productos/interpretar) convierte la frase en filtros y deja en
 * `texto` las palabras que no encajaron en ninguno. Estas funciones aplican
 * ese texto y el color sobre los productos ya agrupados. La normalización y la
 * raíz son las mismas que usa InterpreteConsulta en el servidor.
 */

/** Minúsculas, sin tildes y solo letras y números separados por un espacio. */
export const normalizar = (texto = '') => String(texto)
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[^a-z0-9.]+/g, ' ')
  .trim();

/** blanco, blanca, blancas → "blanc"; azul, azules → "azul". */
export const raiz = (palabra) => {
  let r = palabra;
  if (r.length > 4 && r.endsWith('s')) r = r.slice(0, -1);
  if (r.length > 3 && /[aoe]$/.test(r)) r = r.slice(0, -1);
  return r;
};

const palabras = (texto) => normalizar(texto).split(' ').filter(Boolean);

/**
 * Cada palabra buscada tiene que aparecer en el nombre, modelo, marca o
 * categoría, en cualquier orden: "force air" encuentra "Air Force 1".
 */
export const coincideTexto = (producto, texto) => {
  const buscadas = palabras(texto);
  if (buscadas.length === 0) return true;
  const contenido = normalizar([
    producto.nombre, producto.modelo, producto.marcaPrincipal, producto.categoria_id?.nombre,
  ].filter(Boolean).join(' '));
  return buscadas.every((palabra) => contenido.includes(palabra));
};

/** "Blanco" coincide con una variante "Blanco/Negro" o "blanca". */
export const coincideColor = (colorVariante, color) => {
  if (!color) return true;
  if (!colorVariante) return false;
  const disponibles = new Set(palabras(colorVariante).map(raiz));
  return palabras(color).map(raiz).every((r) => disponibles.has(r));
};
