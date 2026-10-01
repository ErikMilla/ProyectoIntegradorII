import { Link } from 'react-router-dom';
import '../css/Home.css';

const categories = [
  { label: 'Retros exclusivos', image: 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=300&q=80' },
  { label: 'Chunkys', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=300&q=80' },
  { label: 'Air Force One', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80' },
  { label: 'Running urbano', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=300&q=80' },
];

const bestSellers = [
  { name: 'Air Force 1 Zeu blanc', price: 'S/459', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
  { name: 'Air Jordan Retro 3 Black Cat', price: 'S/899', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Forum Low Bad Bunny', price: 'S/999', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80' },
];

function Home() {
  return (
    <div className="storefront-home">
      <section className="home-hero" aria-label="Nueva colección Drop Store">
        <div className="home-hero-copy">
          <p>Nueva colección</p>
          <h1>Streetwear que<br />marca el paso.</h1>
          <Link to="/catalogo" className="home-primary-link">Comprar ahora</Link>
        </div>
        <img className="home-hero-image" src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=85" alt="Zapatillas urbanas negras" />
      </section>

      <section className="home-section home-categories" aria-labelledby="category-title">
        <h2 id="category-title" className="visually-hidden">Categorías destacadas</h2>
        <div className="home-category-list">
          {categories.map((category) => (
            <Link key={category.label} to="/catalogo" className="home-category">
              <img src={category.image} alt="" />
              <span>{category.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section home-best-sellers" aria-labelledby="best-sellers-title">
        <div className="home-section-heading">
          <h2 id="best-sellers-title">Best sellers</h2>
          <Link to="/catalogo">Ver todo</Link>
        </div>
        <div className="home-product-list">
          {bestSellers.map((product) => (
            <article className="home-product" key={product.name}>
              <Link to="/catalogo" className="home-product-image"><img src={product.image} alt={product.name} /></Link>
              <div className="home-rating" aria-label="Calificación 5 de 5">★★★★★ <span>5.0/5</span></div>
              <h3>{product.name}</h3>
              <p>{product.price}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
