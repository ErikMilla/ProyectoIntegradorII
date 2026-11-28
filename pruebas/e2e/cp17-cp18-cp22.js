// CP17, CP18 y CP22 de punta a punta con Playwright, contra el backend en perfil local (H2).
// Ver README.md de esta carpeta. NUNCA contra bd_tiendadrop: registra ventas reales.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const [FRONT, API, OUT] = process.argv.slice(2);
const CLAVE = process.env.CLAVE_DEMO;
const ADMIN_CORREO = process.env.ADMIN_CORREO || 'admin@dropstore.local';
const ENTORNO = 'backend local H2 de prueba (perfil local, base nueva con datos de ejemplo), sin bd_tiendadrop';
const resultados = {};
const registro = { entorno: ENTORNO, front: FRONT, api: API, resultados, pasos: [] };

const ahoraLima = () => new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(new Date()).replace(',', '');
const paso = (cp, texto, extra = {}) => {
  const p = { cp, hora: ahoraLima(), texto, ...extra };
  registro.pasos.push(p);
  console.log(`[${p.hora}] ${cp}: ${texto}`, Object.keys(extra).length ? JSON.stringify(extra) : '');
};

async function capturar(page, archivo, titulo) {
  await page.evaluate((t) => {
    document.getElementById('franja-captura')?.remove();
    const d = document.createElement('div');
    d.id = 'franja-captura';
    d.setAttribute('style', 'position:fixed;top:0;left:0;right:0;z-index:2147483647;height:34px;box-sizing:border-box;'
      + 'padding:0 14px;display:flex;align-items:center;background:#e6e6e6;border-bottom:1px solid #c8c8c8;'
      + 'font:13px "Segoe UI",Arial,sans-serif;color:#222;white-space:nowrap;overflow:hidden;');
    d.textContent = t;
    document.body.appendChild(d);
  }, `Captura automática · ${titulo} · ${ENTORNO} · ${ahoraLima()} (hora de Lima)`);
  await page.screenshot({ path: path.join(OUT, archivo) });
  await page.evaluate(() => document.getElementById('franja-captura')?.remove());
}

async function iniciarSesion(page, correo, reintento = false) {
  await page.goto(`${FRONT}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', correo);
  await page.fill('#login-password', CLAVE);
  await page.click('button[type="submit"]');
  // ADMIN y ALMACENERO piden un segundo factor. En la base de prueba el backend
  // corre con MFA_DEV_CODE_ENABLED=true y la pantalla muestra el código.
  const campoCodigo = page.locator('#auth-code');
  const aviso = page.locator('[role="alert"]');
  await Promise.race([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 }),
    campoCodigo.waitFor({ timeout: 15000 }),
    aviso.first().waitFor({ timeout: 15000 }),
  ]);
  if (!(await campoCodigo.isVisible()) && new URL(page.url()).pathname.startsWith('/login')) {
    // Si el mismo usuario pidió un código hace menos de 60 s, el backend no envía
    // otro (dropstore.mfa.resend-cooldown). Se espera y se reintenta una vez.
    const texto = (await aviso.first().innerText().catch(() => '')).trim();
    if (reintento) throw new Error(`No se pudo iniciar sesión como ${correo}: ${texto}`);
    console.log(`  (login de ${correo}: "${texto}". Se reintenta en 61 s)`);
    await page.waitForTimeout(61000);
    return iniciarSesion(page, correo, true);
  }
  if (await campoCodigo.isVisible()) {
    const codigo = (await page.locator('.auth-dev strong').innerText()).trim();
    await campoCodigo.fill(codigo);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
    return { conSegundoFactor: true };
  }
  return { conSegundoFactor: false };
}

// La ficha muestra "8 disponibles" o, con 3 o menos, "Quedan 3 en talla 42".
const stockTalla42 = async (page) => (await page.locator('.pdp-stock').first().innerText()).trim();
const unidades = (texto) => Number((texto.match(/\d+/) || [])[0]);

(async () => {
  if (!CLAVE) throw new Error('Falta CLAVE_DEMO');
  const browser = await chromium.launch();
  const opciones = { viewport: { width: 1366, height: 860 }, bypassCSP: true };

  // ------------------------------------------------------------------ CP18
  const visitante = await (await browser.newContext(opciones)).newPage();
  await visitante.goto(`${FRONT}/producto/49`, { waitUntil: 'networkidle' });
  await visitante.getByRole('button', { name: 'Talla 42', exact: true }).click();
  const antes = await stockTalla42(visitante);
  paso('CP18', 'Visitante en la ficha de Adidas Campus 00s, talla 42', { stock: antes });

  // Suscripción SSE propia en la misma pestaña, solo para registrar la hora de cada evento.
  await visitante.evaluate((api) => {
    window.__eventosSse = [];
    const fuente = new EventSource(`${api}/api/stock/eventos`);
    const guardar = (tipo) => (e) => window.__eventosSse.push({ tipo, hora: new Date().toISOString(), datos: e.data });
    fuente.addEventListener('stock', guardar('stock'));
    fuente.onmessage = guardar('message');
    window.__fuenteSse = fuente;
  }, API);
  let navegaciones = 0;
  visitante.on('framenavigated', (f) => { if (f === visitante.mainFrame()) navegaciones += 1; });
  await capturar(visitante, 'cp18-stock-antes.png', `CP18 · visitante, stock antes de la venta (${antes})`);

  const vendedor = await (await browser.newContext(opciones)).newPage();
  await iniciarSesion(vendedor, 'vendedor@dropstore.local');
  paso('CP18', 'VENDEDOR inició sesión', { url: vendedor.url() });
  await vendedor.goto(`${FRONT}/intranet-vendedor`, { waitUntil: 'networkidle' });
  const selectorCliente = vendedor.locator('.pos-cliente select');
  // Primer cliente real de la lista (la opción 0 es "Seleccionar cliente").
  const opcionCliente = selectorCliente.locator('option:not([value=""])').first();
  const valorCliente = await opcionCliente.getAttribute('value');
  const textoCliente = (await opcionCliente.innerText()).trim();
  await selectorCliente.selectOption(valorCliente);
  await vendedor.fill('input[placeholder="Nombre, modelo, marca, color o talla"]', 'Campus');
  const fila42 = vendedor.locator('li', { hasText: 'Adidas Campus 00s' }).filter({ hasText: 'Talla 42 ·' });
  await fila42.getByRole('button', { name: 'Agregar' }).click();
  paso('CP18', 'POS: cliente y producto seleccionados', { cliente: textoCliente, producto: 'Adidas Campus 00s talla 42 x1' });
  await capturar(vendedor, 'cp18-pos-venta.png', 'CP18 · VENDEDOR en el POS, antes de finalizar la venta');

  // Registra cada aviso que muestre el POS, aunque dure milisegundos (INC08).
  await vendedor.evaluate(() => {
    window.__avisosPos = [];
    const guardar = (n) => {
      if (n.nodeType === 1 && n.matches?.('.admin-notice')) window.__avisosPos.push(n.textContent.trim());
      n.querySelectorAll?.('.admin-notice').forEach((m) => window.__avisosPos.push(m.textContent.trim()));
    };
    new MutationObserver((cambios) => cambios.forEach((c) => {
      c.addedNodes.forEach(guardar);
      if (c.type === 'characterData' || c.type === 'childList') guardar(c.target);
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  const respuestaVenta = vendedor.waitForResponse((r) => r.url().includes('/api/v1/ventas') && r.request().method() === 'POST');
  await vendedor.getByRole('button', { name: 'Finalizar venta' }).click();
  const venta = await respuestaVenta;
  const cuerpoVenta = await venta.json().catch(() => ({}));
  paso('CP18', 'Venta registrada en el POS', { http: venta.status(), ventaId: cuerpoVenta.id, total: cuerpoVenta.total });
  await vendedor.waitForTimeout(1500);
  const avisosPos = [...new Set(await vendedor.evaluate(() => window.__avisosPos))];
  resultados.CP22_pos_no_promete_facturacion = !avisosPos.some((a) => /Facturaci[oó]n/i.test(a));
  paso('CP22', 'Avisos mostrados por el POS al VENDEDOR tras la venta', { avisosPos });

  // Se espera hasta 15 s a que la ficha cambie sola; no se corta si no cambia.
  const esperado = unidades(antes) - 1;
  const cambio = await visitante.waitForFunction((n) => {
    const el = document.querySelector('.pdp-stock');
    return el && Number((el.textContent.match(/\d+/) || [])[0]) === n;
  }, esperado, { timeout: 15000 }).then(() => true, () => false);
  const despues = await stockTalla42(visitante);
  const eventos = await visitante.evaluate(() => window.__eventosSse);
  resultados.CP18_sse_backend = eventos.some((e) => e.tipo === 'stock');
  resultados.CP18_ficha_sin_recargar = cambio && navegaciones === 0;
  paso('CP18', cambio ? 'Visitante: stock actualizado sin recargar' : 'Visitante: la ficha NO cambió en 15 s sin recargar',
    { esperado, mostrado: despues, navegacionesDespuesDeCargar: navegaciones, eventosSse: eventos });
  await capturar(visitante, 'cp18-stock-despues.png',
    `CP18 · visitante, después de la venta y SIN recargar: muestra "${despues}" (esperado ${esperado})`);
  fs.writeFileSync(path.join(OUT, 'cp18-evento-sse.json'), JSON.stringify({
    ventaId: cuerpoVenta.id, horaVentaLima: registro.pasos.at(-2).hora, esperado, mostradoSinRecargar: despues, eventos,
  }, null, 2));
  await visitante.reload({ waitUntil: 'networkidle' });
  await visitante.getByRole('button', { name: 'Talla 42', exact: true }).click();
  const trasRecargar = await stockTalla42(visitante);
  paso('CP18', 'Visitante: stock tras recargar la página', { stock: trasRecargar });
  await capturar(visitante, 'cp18-stock-tras-recargar.png', `CP18 · visitante, después de recargar la ficha (${trasRecargar})`);

  // ------------------------------------------------------------------ CP22
  // El VENDEDOR ve la venta en su historial, pero abrir e imprimir el
  // comprobante es de ADMIN, en Facturación (decisión de INC08).
  await vendedor.locator('h1', { hasText: 'Ventas registradas' }).waitFor({ timeout: 15000 });
  const numero = `F-${String(cuerpoVenta.id).padStart(5, '0')}`;
  const fila = vendedor.locator('tr', { hasText: numero });
  await fila.waitFor({ timeout: 15000 });
  const celdas = (await fila.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  resultados.CP22_campos_en_historial = celdas[0] === numero && celdas.length >= 6 && /S\/\s?\d/.test(celdas.at(-1));
  paso('CP22', 'Historial del VENDEDOR: fila de la venta', { numero, celdas });
  await fila.evaluate((el) => { el.style.outline = '3px solid #d9002b'; });
  await capturar(vendedor, 'cp22-historial-vendedor.png', `CP22 · historial del VENDEDOR, venta ${numero}`);

  const admin = await (await browser.newContext(opciones)).newPage();
  const ingresoAdmin = await iniciarSesion(admin, ADMIN_CORREO);
  paso('CP22', 'ADMIN inició sesión', { url: admin.url(), ...ingresoAdmin });
  await admin.goto(`${FRONT}/intranet-admin`, { waitUntil: 'networkidle' });
  await admin.getByRole('button', { name: 'Facturación' }).first().click();
  const filaAdmin = admin.locator('tr', { hasText: numero });
  await filaAdmin.waitFor({ timeout: 15000 });
  await filaAdmin.getByRole('button', { name: 'Ver' }).click();
  const comprobante = admin.locator('[role="dialog"]', { hasText: `Factura ${numero}` });
  await comprobante.waitFor({ timeout: 10000 });
  const dato = async (nombre) => (await comprobante.locator('dt', { hasText: nombre }).first()
    .locator('xpath=following-sibling::dd').innerText()).trim();
  const datosComprobante = {
    numero: (await comprobante.locator('#invoice-title').innerText()).trim(),
    fecha: await dato('Fecha'),
    canal: await dato('Canal'),
    total: (await comprobante.locator('.invoice-total strong').innerText()).trim(),
  };
  resultados.CP22_comprobante_admin = datosComprobante.numero.includes(numero) && Boolean(datosComprobante.fecha)
    && datosComprobante.canal === 'Presencial' && /S\/\s?\d/.test(datosComprobante.total);
  paso('CP22', 'ADMIN abre el comprobante en Facturación', datosComprobante);
  await capturar(admin, 'cp22-comprobante-admin.png', `CP22 · ADMIN, Facturación, comprobante ${numero}`);
  // Se cuenta la llamada en lugar de abrir el diálogo de impresión del navegador.
  await admin.evaluate(() => { window.__impresiones = 0; window.print = () => { window.__impresiones += 1; }; });
  await comprobante.getByRole('button', { name: 'Imprimir' }).click();
  const impresiones = await admin.evaluate(() => window.__impresiones);
  resultados.CP22_imprimir_admin = impresiones === 1;
  paso('CP22', 'ADMIN pulsa Imprimir en el comprobante', { llamadasAWindowPrint: impresiones });

  // ------------------------------------------------------------------ CP17
  const cliente = await (await browser.newContext(opciones)).newPage();
  await iniciarSesion(cliente, 'cliente@dropstore.local');
  paso('CP17', 'CLIENTE inició sesión', { url: cliente.url() });
  await cliente.goto(`${FRONT}/producto/49`, { waitUntil: 'networkidle' });
  await cliente.getByRole('button', { name: 'Talla 42', exact: true }).click();
  await cliente.getByRole('button', { name: /Añadir al carrito/ }).click();
  await cliente.goto(`${FRONT}/carrito`, { waitUntil: 'networkidle' });
  await cliente.locator('button.checkout-cta').click();
  await cliente.waitForURL(/proceso-pago/, { timeout: 15000 });
  for (const [id, valor] of [['#nombre', 'Cliente Demo'], ['#email', 'cliente@dropstore.local'],
    ['#telefono', '999111222'], ['#direccion', 'Av. Prueba 123, Lima'],
    ['#numero', '4111111111111111'], ['#fecha', '12/30'], ['#cvv', '123']]) {
    await cliente.fill(id, '');
    await cliente.fill(id, valor);
  }
  paso('CP17', 'Checkout completado con tarjeta de demostración (sin cobro real)');
  const respuestaPedido = cliente.waitForResponse((r) => r.url().includes('/api/v1/ventas') && r.request().method() === 'POST');
  await cliente.locator('button.checkout-cta').click();
  const pedido = await respuestaPedido;
  const cuerpoPedido = await pedido.json().catch(() => ({}));
  await cliente.waitForTimeout(1500);
  const rutaFinal = new URL(cliente.url()).pathname;
  const tituloFinal = (await cliente.locator('h1').first().innerText().catch(() => '')).trim();
  const vioConfirmacion = /pedido confirmado/i.test(tituloFinal);
  paso('CP17', vioConfirmacion ? 'El cliente ve la confirmación del pedido' : 'El cliente NO ve la confirmación',
    { http: pedido.status(), ventaId: cuerpoPedido.id, total: cuerpoPedido.total, canal: cuerpoPedido.tipo_venta, rutaFinal, tituloFinal });
  resultados.CP17_confirmacion = pedido.status() === 201 && vioConfirmacion;
  await capturar(cliente, 'cp17-confirmacion.png',
    `CP17 · pantalla tras pagar (venta ${cuerpoPedido.id} registrada, HTTP ${pedido.status()}): ruta ${rutaFinal}, título "${tituloFinal}"`);

  await cliente.goto(`${FRONT}/mis-pedidos`, { waitUntil: 'networkidle' });
  const numeroPedido = `${cuerpoPedido.id}`;
  await cliente.locator('.order-heading button').first().click();
  await cliente.waitForTimeout(400);
  const textoPedido = (await cliente.locator('.orders-list, main').first().innerText()).replace(/\s+/g, ' ').slice(0, 600);
  const numeroF = `F-${String(cuerpoPedido.id).padStart(5, '0')}`;
  resultados.CP17_mis_pedidos = textoPedido.includes(numeroF) && /Adidas Campus 00s 42 1/.test(textoPedido);
  paso('CP17', 'Mis pedidos', { ventaId: numeroPedido, numero: numeroF, texto: textoPedido });
  await capturar(cliente, 'cp17-mis-pedidos.png', `CP17 · Mis pedidos del CLIENTE con el pedido ${numeroPedido}`);

  fs.writeFileSync(path.join(OUT, 'cp17-cp18-cp22-registro.json'), JSON.stringify(registro, null, 2));
  await browser.close();
  console.log('\nRESULTADOS');
  for (const [nombre, ok] of Object.entries(resultados)) console.log(`  ${ok ? 'Aprobado' : 'Falla   '}  ${nombre}`);
  if (Object.values(resultados).some((ok) => !ok)) process.exitCode = 1;
})().catch((e) => {
  console.error('FALLO:', e.message);
  fs.writeFileSync(path.join(OUT, 'cp17-cp18-cp22-registro.json'), JSON.stringify({ ...registro, error: e.message }, null, 2));
  process.exit(1);
});
