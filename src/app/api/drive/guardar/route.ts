import { NextRequest, NextResponse } from 'next/server';

const MAX_INTENTOS = 3;
const TIMEOUT_POR_INTENTO_MS = 18_000;

type RespuestaAppsScript = {
  ok?: boolean;
  error?: string;
  mensaje?: string;
  evaluacionId?: string;

  reemplazados?: {
    json?: number;
    excel?: number;
  };

  json?: {
    id: string;
    nombre: string;
  } | null;

  excel?: {
    id: string;
    nombre: string;
  } | null;
};

function esperar(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function enviarAAppsScript(
  url: string,
  payload: unknown,
  intento: number
): Promise<RespuestaAppsScript> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    TIMEOUT_POR_INTENTO_MS
  );

  try {
    const response = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type':
          'text/plain;charset=utf-8',
      },

      body: JSON.stringify(payload),

      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });

    const texto =
      await response.text();

    let data: RespuestaAppsScript;

    try {
      data = JSON.parse(texto);
    } catch {
      console.error(
        `Apps Script devolvió respuesta no JSON. Intento ${intento}/${MAX_INTENTOS}.`,
        texto.slice(0, 300)
      );

      throw new Error(
        'RESPUESTA_NO_JSON'
      );
    }

    /**
     * Si Apps Script respondió JSON correctamente,
     * respetamos el error que él mismo nos devuelve.
     */
    if (!response.ok || !data.ok) {
      const mensaje =
        data.error ||
        'Apps Script no pudo guardar la evaluación.';

      /**
       * El bloqueo puede ser temporal, así que
       * permitimos reintentar.
       */
      if (
        mensaje
          .toLowerCase()
          .includes('otra operación')
      ) {
        throw new Error(
          `ERROR_TEMPORAL:${mensaje}`
        );
      }

      throw new Error(
        `ERROR_APPS_SCRIPT:${mensaje}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const url =
      process.env.APPS_SCRIPT_URL;

    if (!url) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'APPS_SCRIPT_URL no está configurada.',
        },
        { status: 500 }
      );
    }

    const body =
      await request.json();

    if (!body?.evaluacion) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'No se recibió la evaluación.',
        },
        { status: 400 }
      );
    }

    /**
     * Para poder reintentar de forma segura,
     * necesitamos que todos los intentos usen
     * exactamente el mismo id.
     */
    const evaluacionId =
      typeof body.evaluacion.id ===
        'string'
        ? body.evaluacion.id.trim()
        : '';

    if (!evaluacionId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'La evaluación no tiene un id válido.',
        },
        { status: 400 }
      );
    }

    const payload = {
      accion: 'guardarEvaluacion',

      evaluacion: {
        ...body.evaluacion,
        id: evaluacionId,
      },

      excelBase64:
        body.excelBase64 || null,
    };

    let ultimoError:
      | Error
      | null = null;

    for (
      let intento = 1;
      intento <= MAX_INTENTOS;
      intento++
    ) {
      try {
        const data =
          await enviarAAppsScript(
            url,
            payload,
            intento
          );

        /**
         * Si llegamos aquí, Google confirmó
         * correctamente el guardado.
         */
        return NextResponse.json(
          data
        );
      } catch (error) {
        const actual =
          error instanceof Error
            ? error
            : new Error(
                'Error desconocido.'
              );

        ultimoError = actual;

        /**
         * Un error explícito de negocio de
         * Apps Script no debe reintentarse.
         */
        if (
          actual.message.startsWith(
            'ERROR_APPS_SCRIPT:'
          )
        ) {
          return NextResponse.json(
            {
              ok: false,

              error:
                actual.message.replace(
                  'ERROR_APPS_SCRIPT:',
                  ''
                ),
            },
            { status: 502 }
          );
        }

        console.warn(
          `Falló guardado en Apps Script. Intento ${intento}/${MAX_INTENTOS}:`,
          actual.message
        );

        if (
          intento <
          MAX_INTENTOS
        ) {
          /**
           * Espera progresiva:
           *
           * intento 1 -> 700 ms
           * intento 2 -> 1500 ms
           */
          await esperar(
            intento === 1
              ? 700
              : 1500
          );
        }
      }
    }

    console.error(
      'Apps Script falló después de todos los reintentos:',
      ultimoError
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          'Google Drive no respondió correctamente después de varios intentos. Tus datos siguen guardados como borrador; puedes volver a intentarlo.',
      },
      { status: 502 }
    );
  } catch (error) {
    console.error(
      'Error guardando en Google Drive:',
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al guardar en Drive.',
      },
      { status: 500 }
    );
  }
}