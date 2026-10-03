/**
 * Muestra una calificacion de 0 a 5 en estrellas.
 * Redondea a la media estrella mas cercana para no inventar precision.
 */
function Estrellas({ valor = 0, max = 5 }) {
  const redondeado = Math.round(Number(valor) * 2) / 2;

  return (
    <span className="estrellas" aria-label={`Calificación ${redondeado} de ${max}`}>
      {Array.from({ length: max }, (_, indice) => {
        const posicion = indice + 1;
        if (redondeado >= posicion) return <i key={posicion} className="llena" aria-hidden="true">★</i>;
        if (redondeado >= posicion - 0.5) return <i key={posicion} className="media" aria-hidden="true">★</i>;
        return <i key={posicion} className="vacia" aria-hidden="true">★</i>;
      })}
    </span>
  );
}

export default Estrellas;
