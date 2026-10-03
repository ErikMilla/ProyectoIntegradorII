import { useEffect, useMemo, useState } from 'react';
import ContentService from '../../services/content.service';
import { mensajeDeError, resolverUrlImagen } from '../../services/api';

const INICIAL = {
  etiqueta: 'Catálogo 2026',
  titulo: 'Streetwear que marca el paso.',
  textoBoton: 'Comprar ahora',
  enlaceBoton: '/catalogo',
  mensajePromocional: 'ENVÍOS GRATIS A TODO EL PERÚ',
  imagenBanner: '',
  alturaEscritorio: 440,
  alturaMovil: 340,
  posicionImagen: 'centro',
};

function ContenidoTienda() {
  const [contenido, setContenido] = useState(INICIAL);
  const [imagen, setImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    ContentService.obtener({ refrescar: true })
      .then(({ data }) => setContenido({ ...INICIAL, ...data }))
      .catch((error) => setMensaje(mensajeDeError(error, 'No pudimos cargar el contenido actual.')));
  }, []);

  const vistaPrevia = useMemo(() => {
    if (imagen) return URL.createObjectURL(imagen);
    return contenido.imagenBanner ? resolverUrlImagen(contenido.imagenBanner) : '';
  }, [imagen, contenido.imagenBanner]);

  useEffect(() => () => {
    if (vistaPrevia?.startsWith('blob:')) URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  const cambiar = (evento) => {
    const { name, value, type } = evento.target;
    setContenido((actual) => ({ ...actual, [name]: type === 'number' ? Number(value) : value }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      const { data } = await ContentService.actualizar(contenido, imagen);
      setContenido({ ...INICIAL, ...data });
      setImagen(null);
      setMensaje('Contenido publicado correctamente.');
    } catch (error) {
      setMensaje(mensajeDeError(error, 'No pudimos guardar los cambios.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="admin-module">
      <header className="module-header">
        <div><h1>Contenido de la tienda</h1></div>
      </header>

      <p className="admin-notice">
        Usa una imagen horizontal de 1920 × 900 px, JPG o WEBP. El texto va abajo a la izquierda: deja el producto hacia la derecha para que se lea bien.
      </p>

      <div className="content-editor-layout">
        <form className="editor-card content-editor" onSubmit={guardar}>
          <div className="editor-heading"><div><h2>Banner de inicio</h2></div></div>
          <div className="field-grid">
            <label>Etiqueta superior<input name="etiqueta" maxLength="80" required value={contenido.etiqueta} onChange={cambiar} /></label>
            <label>Texto del botón<input name="textoBoton" maxLength="50" required value={contenido.textoBoton} onChange={cambiar} /></label>
            <label className="full-field">Título principal<textarea name="titulo" rows="3" maxLength="140" required value={contenido.titulo} onChange={cambiar} /></label>
            <label>Enlace del botón<input name="enlaceBoton" required pattern="/.*" value={contenido.enlaceBoton} onChange={cambiar} /></label>
            <label>Enfoque de la imagen<select name="posicionImagen" value={contenido.posicionImagen} onChange={cambiar}><option value="izquierda">Izquierda</option><option value="centro">Centro</option><option value="derecha">Derecha</option></select></label>
            <label>Altura en escritorio<input name="alturaEscritorio" type="number" min="320" max="520" value={contenido.alturaEscritorio} onChange={cambiar} /></label>
            <label>Altura en móvil<input name="alturaMovil" type="number" min="280" max="440" value={contenido.alturaMovil} onChange={cambiar} /></label>
            <label className="full-field">Mensaje de la franja superior<input name="mensajePromocional" maxLength="180" required value={contenido.mensajePromocional} onChange={cambiar} /></label>
            <label className="full-field content-file-field">Nueva imagen del banner<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(evento) => setImagen(evento.target.files?.[0] || null)} /><small>Máximo 5 MB. Si no eliges una imagen, se conserva la actual.</small></label>
          </div>
          <button className="primary-button full-button" type="submit" disabled={guardando}>{guardando ? 'Publicando…' : 'Publicar cambios'}</button>
          {mensaje && <p className="form-feedback" role="status">{mensaje}</p>}
        </form>

        <section className="content-preview-card" aria-label="Vista previa del banner">
          <header><span>Vista previa</span><small>Se actualiza antes de publicar</small></header>
          <div className={`content-preview content-preview--${contenido.posicionImagen}`} style={vistaPrevia ? { backgroundImage: `url(${vistaPrevia})` } : undefined}>
            <div><small>{contenido.etiqueta}</small><strong>{contenido.titulo}</strong><span>{contenido.textoBoton}</span></div>
          </div>
          <p>{contenido.mensajePromocional}</p>
        </section>
      </div>
    </section>
  );
}

export default ContenidoTienda;
