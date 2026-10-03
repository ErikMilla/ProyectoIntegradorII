/**
 * Pantalla inicial que le corresponde a cada rol después de iniciar sesión.
 * Se usa tanto al entrar como cuando alguien intenta abrir un panel que no le
 * toca y hay que devolverlo a su sitio.
 */
export const inicioSegunRol = (rol) => {
  switch (rol) {
    case 'ADMIN':
      return '/intranet-admin';
    case 'ALMACENERO':
      return '/intranet-almacen';
    case 'VENDEDOR':
      return '/intranet-vendedor';
    default:
      return '/';
  }
};

export const esRutaDeIntranet = (ruta) => Boolean(ruta) && ruta.startsWith('/intranet-');

/**
 * A dónde va el usuario justo después de iniciar sesión.
 *
 * Si llegó al login porque intentó abrir una página protegida de la tienda
 * (por ejemplo el checkout), lo devolvemos ahí: es lo que esperaba hacer.
 *
 * Pero si lo que intentó abrir era un panel de la intranet, lo ignoramos y lo
 * mandamos SIEMPRE a su propio escritorio. El administrador tiene permiso para
 * entrar a los tres paneles, así que sin esta regla un admin que pasara por
 * /intranet-vendedor terminaba aterrizando en la caja en vez de en su
 * dashboard.
 */
export const destinoTrasLogin = (rol, destinoPrevio) => {
  const inicio = inicioSegunRol(rol);

  if (!destinoPrevio || esRutaDeIntranet(destinoPrevio)) {
    return inicio;
  }

  return destinoPrevio;
};
