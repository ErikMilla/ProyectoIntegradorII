// Calentamiento previo (30 s, 1 usuario) con una consulta sencilla.
//
// La primera petición de una aplicación Java es más lenta (carga de clases,
// conexiones a la base de datos). Se hace antes de medir para no contaminar
// los resultados. No lleva umbrales: sus números no se registran.
import http from 'k6/http';
import { sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

export const options = {
  vus: 1,
  duration: '30s',
};

export default function () {
  http.get(`${BASE_URL}/api/marcas`);
  sleep(1);
}
