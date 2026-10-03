/**
 * Iconos de trazo de la tienda y la intranet. Un solo set dibujado a 24px
 * con trazo de 1.75, para que todos pesen lo mismo.
 *
 *   <Icon name="bag" />            decorativo (aria-hidden)
 *   <Icon name="bag" label="..." /> con nombre accesible
 */
const PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>,
  user: <><circle cx="12" cy="8" r="3.75" /><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  logout: <><path d="M14 4h5v16h-5" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.75" /><circle cx="17.5" cy="17.5" r="1.75" /></>,
  swap: <><path d="M7 4 3 8l4 4M3 8h13" /><path d="m17 12 4 4-4 4m4-4H8" /></>,
  shield: <><path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  badge: <><circle cx="12" cy="10" r="6" /><path d="m9 15.5-1.5 5.5L12 19l4.5 2-1.5-5.5" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="M3 10h18M7 15h3" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></>,
  users: <><circle cx="9" cy="8.5" r="3.25" /><path d="M3 19c.6-3 3-4.75 6-4.75s5.4 1.75 6 4.75" /><path d="M15.5 5.6a3.25 3.25 0 0 1 0 5.8M17.5 14.6c1.8.6 3 2.1 3.5 4.4" /></>,
  box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  register: <><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M7 9V4h10v5M8 13h2M12 13h2M16 13h0M8 16.5h8" /></>,
  chart: <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="1" /><circle cx="9" cy="9.5" r="1.75" /><path d="m4 17 5-5 4 4 2.5-2.5L20 18" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.75v2.5M12 18.75v2.5M2.75 12h2.5M18.75 12h2.5M5.45 5.45l1.77 1.77M16.78 16.78l1.77 1.77M5.45 18.55l1.77-1.77M16.78 7.22l1.77-1.77" /></>,
  alert: <><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4.5M12 17.25v.25" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3 4v4h4M12 7.5V12l3 2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

function Icon({ name, size = 20, label, className = '', strokeWidth = 1.75 }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export default Icon;
