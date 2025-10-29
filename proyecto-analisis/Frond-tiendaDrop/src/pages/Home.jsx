import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import '../css/Home.css';

const Home = () => {
  useEffect(() => {
    // Intersection Observer para animación en scroll
    const sections = document.querySelectorAll('.section');
    
    const options = {
      root: null,
      threshold: 0.3,
    };

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    sections.forEach(section => observer.observe(section));

    // Animación de título letra por letra
    const titulo = document.querySelector('.titulo-principal');
    if (titulo) {
      const texto = titulo.textContent;
      titulo.innerHTML = '';
      [...texto].forEach((letra, index) => {
        const span = document.createElement('span');
        span.textContent = letra === ' ' ? '\u00A0' : letra;
        span.style.animationDelay = `${index * 0.05}s`;
        span.classList.add('letra-animada');
        titulo.appendChild(span);
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="inicio-container">
      {/* Hero Section - Banner Principal */}
      <section className="section hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="titulo-principal">TiendaDrop</h1>
            <p className="hero-subtitle">Las mejores zapatillas del mercado</p>
            <p className="hero-description">
              Descubre nuestra colección exclusiva de sneakers de las marcas más prestigiosas. 
              Estilo, comodidad y calidad en cada paso.
            </p>
            <div className="hero-buttons">
              <Link to="/productos" className="btn-primary">
                Ver Colección
              </Link>
              <Link to="/ofertas" className="btn-secondary">
                Ofertas Especiales
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-background">
          <img 
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" 
            alt="Zapatillas Nike" 
          />
        </div>
      </section>

      {/* Sección Estadísticas */}
      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Clientes Satisfechos</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">200+</div>
              <div className="stat-label">Modelos Disponibles</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Atención al Cliente</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">10+</div>
              <div className="stat-label">Marcas Premium</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <div className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🚚</span>
              <h3>Envío Gratis</h3>
              <p>En pedidos superiores a S/150 a todo el Perú</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⭐</span>
              <h3>100% Original</h3>
              <p>Todas nuestras zapatillas son auténticas</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💰</span>
              <h3>Mejores Precios</h3>
              <p>Precios competitivos y ofertas exclusivas</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔄</span>
              <h3>Cambios Fáciles</h3>
              <p>30 días para cambios y devoluciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="categories">
        <div className="container">
          <h2>Explora por Categoría</h2>
          <div className="categories-grid">
            <Link to="/running" className="category-card">
              <img src="https://images.unsplash.com/photo-1539185441755-769473a23570" alt="Running" />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Running</h3>
                <p>Para corredores profesionales y amateurs</p>
              </div>
            </Link>
            <Link to="/casual" className="category-card">
              <img src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2" alt="Casual" />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Casual</h3>
                <p>Estilo urbano para el día a día</p>
              </div>
            </Link>
            <Link to="/deportivas" className="category-card">
              <img src="https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2" alt="Deportivas" />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Deportivas</h3>
                <p>Para entrenamientos de alto rendimiento</p>
              </div>
            </Link>
            <Link to="/basket" className="category-card">
              <img src="https://images.unsplash.com/photo-1608231387042-66d1773070a5" alt="Basketball" />
              <div className="category-overlay"></div>
              <div className="category-content">
                <h3>Basketball</h3>
                <p>Diseñadas para la cancha</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Productos Destacados */}
      <div className="featured-products">
        <div className="container">
          <div className="featured-products-header">
            <h2>Productos Destacados</h2>
            <p>Los sneakers más populares y con mejor valoración de nuestros clientes.</p>
          </div>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-image">
                <span className="product-badge badge-offer">-25%</span>
                <button className="favorite-btn" aria-label="Añadir a favoritos">
                  ❤
                </button>
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff"
                  alt="Nike Air Max"
                />
                <Link to="/producto/1" className="quick-view">Vista Rápida</Link>
              </div>
              <div className="product-info">
                <span className="product-brand">Nike</span>
                <h3 className="product-title">Air Max 270</h3>
                <div className="product-rating">
                  ⭐⭐⭐⭐⭐ <span>(128)</span>
                </div>
                <div className="product-price">
                  <span className="current-price">S/449</span>
                  <span className="original-price">S/599</span>
                </div>
              </div>
            </div>

            <div className="product-card">
              <div className="product-image">
                <span className="product-badge badge-new">Nuevo</span>
                <button className="favorite-btn" aria-label="Añadir a favoritos">
                  ❤
                </button>
                <img
                  src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa"
                  alt="Adidas Ultraboost"
                />
                <Link to="/producto/2" className="quick-view">Vista Rápida</Link>
              </div>
              <div className="product-info">
                <span className="product-brand">Adidas</span>
                <h3 className="product-title">Ultraboost 22</h3>
                <div className="product-rating">
                  ⭐⭐⭐⭐⭐ <span>(95)</span>
                </div>
                <div className="product-price">
                  <span className="current-price">S/699</span>
                </div>
              </div>
            </div>

            <div className="product-card">
              <div className="product-image">
                <button className="favorite-btn" aria-label="Añadir a favoritos">
                  ❤
                </button>
                <img
                  src="https://images.unsplash.com/photo-1605348532760-6753d2c43329"
                  alt="Puma RS-X"
                />
                <Link to="/producto/3" className="quick-view">Vista Rápida</Link>
              </div>
              <div className="product-info">
                <span className="product-brand">Puma</span>
                <h3 className="product-title">RS-X³ Puzzle</h3>
                <div className="product-rating">
                  ⭐⭐⭐⭐ <span>(67)</span>
                </div>
                <div className="product-price">
                  <span className="current-price">S/379</span>
                </div>
              </div>
            </div>

            <div className="product-card">
              <div className="product-image">
                <span className="product-badge badge-offer">-15%</span>
                <button className="favorite-btn" aria-label="Añadir a favoritos">
                  ❤
                </button>
                <img
                  src="https://images.unsplash.com/photo-1552346154-21d32810aba3"
                  alt="New Balance 574"
                />
                <Link to="/producto/4" className="quick-view">Vista Rápida</Link>
              </div>
              <div className="product-info">
                <span className="product-brand">New Balance</span>
                <h3 className="product-title">574 Classic</h3>
                <div className="product-rating">
                  ⭐⭐⭐⭐⭐ <span>(143)</span>
                </div>
                <div className="product-price">
                  <span className="current-price">S/339</span>
                  <span className="original-price">S/399</span>
                </div>
              </div>
            </div>
          </div>
          <Link to="/productos" className="view-all-btn">
            Ver toda la colección
          </Link>
        </div>
      </div>

      {/* Marcas */}
      <section className="section brands-section">
        <div className="container">
          <h2>Marcas Oficiales</h2>
          <div className="brands-grid">
            <div className="brand-logo">Nike</div>
            <div className="brand-logo">Adidas</div>
            <div className="brand-logo">Puma</div>
            <div className="brand-logo">Reebok</div>
            <div className="brand-logo">New Balance</div>
            <div className="brand-logo">Converse</div>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <div className="info-bar">
        <div className="container">
          <div className="info-item">
            <div className="info-icon">🚚</div>
            <div className="info-content">
              <h3>Envío Gratis</h3>
              <p>En pedidos superiores a S/150</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⏱️</div>
            <div className="info-content">
              <h3>Entrega Rápida</h3>
              <p>24-72 horas en Lima</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">✓</div>
            <div className="info-content">
              <h3>100% Auténtico</h3>
              <p>Garantía de originalidad</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;