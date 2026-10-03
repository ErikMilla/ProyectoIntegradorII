import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import '../css/Nosotros.css';

const VALORES = [
  ['badge', 'Autenticidad', 'Productos seleccionados con origen claro y la calidad que esperas.'],
  ['users', 'Cercanía', 'Atención humana antes, durante y después de tu compra.'],
  ['swap', 'Movimiento', 'Modelos que se adaptan a tu ritmo, tu ciudad y tu manera de vivir.'],
];

const ENVIOS = [
  ['Envío estándar', 'S/ 17.00', 'A todo el Perú. Se suma al total en el carrito.'],
  ['Lima Express', 'S/ 12.90', 'Llega el siguiente día hábil dentro de Lima.'],
  ['Cambio de talla', '30 días', 'Si no te queda, la cambias por otra talla disponible.'],
  ['Medios de pago', 'Tarjeta, Yape, Plin', 'Cuotas sin intereses con BCP, BBVA y más.'],
];

function Nosotros() {
  const { hash } = useLocation();

  // Los enlaces del pie apuntan a #envios: al llegar, saltamos a esa sección.
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView();
  }, [hash]);

  return (
    <div className="about">
      <section className="about-intro">
        <div className="container">
          <h1 className="display">Nos movemos contigo.</h1>
          <p>Creemos que unas buenas zapatillas no solo completan un look: acompañan lo que haces y cada lugar al que decides ir.</p>
        </div>
      </section>

      <section className="container about-story" aria-labelledby="historia-title">
        <h2 id="historia-title" className="about-heading">Menos ruido, más movimiento</h2>
        <div>
          <p>Drop Store nace para acercar zapatillas urbanas y deportivas auténticas a quienes convierten la ciudad en su propio camino.</p>
          <p>Seleccionamos modelos versátiles, cuidamos cada detalle de la experiencia y te ayudamos a encontrar el par que encaja contigo, sin complicaciones.</p>
        </div>
      </section>

      <section className="container about-values" aria-labelledby="valores-title">
        <h2 id="valores-title" className="about-heading">Lo que nos importa</h2>
        <ul>
          {VALORES.map(([icono, titulo, texto]) => (
            <li key={titulo}>
              <Icon name={icono} size={28} />
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="envios" className="about-shipping" aria-labelledby="envios-title">
        <div className="container">
          <h2 id="envios-title" className="about-heading">Envíos, cambios y pagos</h2>
          <dl>
            {ENVIOS.map(([titulo, dato, detalle]) => (
              <div key={titulo}>
                <dt>{titulo}</dt>
                <dd><strong>{dato}</strong>{detalle}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container about-cta">
        <h2 className="about-heading">¿Listo para tu próximo par?</h2>
        <Link to="/catalogo" className="btn btn--red">Ver zapatillas</Link>
      </section>
    </div>
  );
}

export default Nosotros;
