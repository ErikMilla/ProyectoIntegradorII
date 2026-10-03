import { Link } from 'react-router-dom';

/**
 * Logotipo de Drop Store: la "D" roja con la zapatilla dentro y "ROP" en la
 * misma condensada pesada del logo original. Hereda el color del texto, así
 * que sirve igual sobre fondo claro (navbar) y oscuro (footer, intranet).
 */
export function BrandMark({ className = '', label = 'Drop Store' }) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="0 0 104 40"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <path d="M0 4h13a16 16 0 0 1 0 32H0z" fill="#e0111b" />
      <path
        d="M0 8V4.8c0-.6.6-1 1.2-.8l2.4 1 2.8-2.6c.45-.4 1.05-.3 1.4.15L9.6 4.8c1.8.6 4.8 1.05 7 1.7.9.3 1.2.9 1.2 1.5V9H0z"
        fill="#fff"
        transform="translate(4.5 16) rotate(-24 9 6)"
      />
      <text
        x="31.5"
        y="36"
        textLength="72"
        lengthAdjust="spacingAndGlyphs"
        fill="currentColor"
        style={{ font: '900 45px Archivo, "Arial Narrow", sans-serif', fontStretch: '62%' }}
      >
        ROP
      </text>
    </svg>
  );
}

function Brand({ className = '' }) {
  return (
    <Link to="/" className={`brand ${className}`.trim()} aria-label="Drop Store, ir al inicio">
      <BrandMark label={null} />
    </Link>
  );
}

export default Brand;
