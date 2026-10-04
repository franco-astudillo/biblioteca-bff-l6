import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanelService } from './panel.service.js';

const config = {
  getOrThrow: (clave: string) => {
    if (clave === 'LIBROS_URL') return 'http://libros.test';
    if (clave === 'PRESTAMOS_URL') return 'http://prestamos.test';
    throw new Error(`configuracion inesperada: ${clave}`);
  },
} as ConfigService;

describe('PanelService', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    vi.restoreAllMocks();
  });

  it('reenvia Authorization al crear un prestamo', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, opciones?: RequestInit) => {
      if (url === 'http://libros.test') {
        return new Response(JSON.stringify([{ id: 2, titulo: 'Dune', ejemplares: 2 }]));
      }
      if (url === 'http://prestamos.test' && !opciones) {
        return new Response(JSON.stringify([]));
      }
      return new Response(
        JSON.stringify({ id: 1, libroId: 2, usuarioSub: 'sub-real', devuelto: false }),
        { status: 201 },
      );
    });
    global.fetch = fetchMock as typeof fetch;

    const servicio = new PanelService(config);
    await servicio.prestar('sub-real', 2, 'Bearer token-real');

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://prestamos.test',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-real',
        },
      }),
    );
  });

  it('reenvia Authorization al devolver un prestamo', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request, opciones?: RequestInit) => {
      if (url === 'http://libros.test') return new Response(JSON.stringify([]));
      if (url === 'http://prestamos.test' && !opciones) {
        return new Response(
          JSON.stringify([{ id: 7, libroId: 2, usuarioSub: 'sub-real', devuelto: false }]),
        );
      }
      return new Response(
        JSON.stringify({ id: 7, libroId: 2, usuarioSub: 'sub-real', devuelto: true }),
      );
    });
    global.fetch = fetchMock as typeof fetch;

    const servicio = new PanelService(config);
    await servicio.devolver('sub-real', 7, 'Bearer token-real');

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://prestamos.test/7',
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer token-real' },
      }),
    );
  });
});
