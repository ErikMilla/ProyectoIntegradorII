import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({ API_BASE_URL: 'http://api.test' }));

class EventSourceFalso {
  static abiertas = [];

  constructor(url) {
    this.url = url;
    this.cerrada = false;
    this.oyentes = {};
    EventSourceFalso.abiertas.push(this);
  }

  addEventListener(tipo, oyente) { this.oyentes[tipo] = oyente; }

  close() { this.cerrada = true; }

  emitir(tipo) { this.oyentes[tipo]?.(); }
}

const activas = () => EventSourceFalso.abiertas.filter((conexion) => !conexion.cerrada);

let documento;
let ventana;

const cambiarVisibilidad = (estado) => {
  documento.visibilityState = estado;
  documento.dispatchEvent(new Event('visibilitychange'));
};

// El servicio registra sus oyentes al importarse: cada prueba lo carga de cero.
const cargarServicio = async () => (await import('./stock.service')).default;

beforeEach(() => {
  vi.resetModules();
  EventSourceFalso.abiertas = [];
  documento = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  ventana = new EventTarget();
  vi.stubGlobal('document', documento);
  vi.stubGlobal('window', ventana);
  vi.stubGlobal('EventSource', EventSourceFalso);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StockService', () => {
  it('comparte una sola conexión y la cierra cuando nadie la usa', async () => {
    const StockService = await cargarServicio();
    const avisarA = vi.fn();
    const avisarB = vi.fn();
    const salirA = StockService.suscribir(avisarA);
    const salirB = StockService.suscribir(avisarB);

    expect(activas()).toHaveLength(1);
    expect(activas()[0].url).toBe('http://api.test/api/stock/eventos');
    activas()[0].emitir('stock');
    expect(avisarA).toHaveBeenCalledTimes(1);
    expect(avisarB).toHaveBeenCalledTimes(1);

    salirA();
    expect(activas()).toHaveLength(1);
    salirB();
    expect(activas()).toHaveLength(0);
  });

  it('cierra la conexión al ocultar la pestaña y al volver la reabre y pide recargar', async () => {
    const StockService = await cargarServicio();
    const avisar = vi.fn();
    StockService.suscribir(avisar);

    cambiarVisibilidad('hidden');
    expect(activas()).toHaveLength(0);
    expect(avisar).not.toHaveBeenCalled();

    cambiarVisibilidad('visible');
    expect(activas()).toHaveLength(1);
    expect(avisar).toHaveBeenCalledTimes(1);
  });

  it('libera la conexión al salir de la página y la recupera al volver desde la caché', async () => {
    const StockService = await cargarServicio();
    const avisar = vi.fn();
    StockService.suscribir(avisar);

    ventana.dispatchEvent(new Event('pagehide'));
    expect(activas()).toHaveLength(0);

    ventana.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(activas()).toHaveLength(1);
    expect(avisar).toHaveBeenCalledTimes(1);
  });

  it('una pestaña abierta en segundo plano no se conecta hasta que se muestra', async () => {
    documento.visibilityState = 'hidden';
    const StockService = await cargarServicio();
    const avisar = vi.fn();
    StockService.suscribir(avisar);
    expect(activas()).toHaveLength(0);

    cambiarVisibilidad('visible');
    expect(activas()).toHaveLength(1);
  });

  it('volver a la pestaña sin pantallas suscritas no abre nada', async () => {
    await cargarServicio();
    cambiarVisibilidad('hidden');
    cambiarVisibilidad('visible');
    expect(activas()).toHaveLength(0);
  });
});
