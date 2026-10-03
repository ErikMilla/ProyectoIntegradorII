import api from './api';

let solicitudContenido;

const ContentService = {
  obtener: ({ refrescar = false } = {}) => {
    if (refrescar || !solicitudContenido) {
      solicitudContenido = api.get('/contenido-tienda').catch((error) => {
        solicitudContenido = null;
        throw error;
      });
    }
    return solicitudContenido;
  },

  actualizar: async (contenido, imagen) => {
    const cuerpo = new FormData();
    cuerpo.append('data', JSON.stringify(contenido));
    if (imagen) cuerpo.append('file', imagen);
    const respuesta = await api.put('/contenido-tienda', cuerpo, {
      headers: { 'Content-Type': undefined },
    });
    solicitudContenido = Promise.resolve(respuesta);
    return respuesta;
  },
};

export default ContentService;
