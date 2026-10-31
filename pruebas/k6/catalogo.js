// Prueba de lectura del catálogo público (GET /api/productos).
//
// No requiere iniciar sesión. Mide SOLO lectura del catálogo: no demuestra la
// capacidad de compra, del POS, del correo ni de las sesiones.
//
// Uso (PowerShell):
//   k6 run -e VUS=10 pruebas/k6/catalogo.js
//   k6 run -e VUS=25 -e DURATION=5m -e BASE_URL=http://localhost:8081 pruebas/k6/catalogo.js
//
// Los umbrales son el criterio de aceptación del SLA (informe, tabla 8.3):
//   p95 del tiempo de respuesta <= 2 s y menos de 1 % de errores.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '2m',
  thresholds: {
    http_req_duration: ['p(95)<=2000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate==1'],
  },
};

// Antes de generar carga se comprueba que la ruta responde y que devuelve
// productos. Si no, la prueba se detiene: no tiene sentido medir una ruta rota.
export function setup() {
  const r = http.get(`${BASE_URL}/api/productos`);
  const variantes = r.status === 200 ? r.json().length : 0;
  console.log(`Catálogo: HTTP ${r.status}, ${variantes} variantes devueltas, ${r.body.length} bytes`);
  if (r.status !== 200 || variantes === 0) {
    throw new Error(
      `La ruta ${BASE_URL}/api/productos no devolvió el catálogo esperado ` +
      `(HTTP ${r.status}, ${variantes} variantes). Corrige el escenario antes de medir.`,
    );
  }
  return { variantes };
}

export default function () {
  const r = http.get(`${BASE_URL}/api/productos`);
  check(r, {
    'catalogo HTTP 200': (x) => x.status === 200,
    'catalogo con productos': (x) => x.body.length > 2,
  });
  sleep(1);
}
