import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 60_000;

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = process.env.APPS_SCRIPT_URL;

    if (!url) {
      return NextResponse.json(
        { ok: false, error: 'APPS_SCRIPT_URL no está configurada.' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const id =
      typeof body?.id === 'string'
        ? body.id.trim()
        : '';

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'No se recibió el id de la evaluación.' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        accion: 'eliminarEvaluacion',
        id,
      }),
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });

    const texto = await response.text();

    let data: {
      ok?: boolean;
      error?: string;
      mensaje?: string;
      evaluacionId?: string;
      jsonEliminados?: number;
      excelEliminados?: number;
    };

    try {
      data = JSON.parse(texto);
    } catch {
      console.error('Apps Script devolvió una respuesta no JSON.');

      return NextResponse.json(
        { ok: false, error: 'Apps Script respondió con un formato inesperado.' },
        { status: 502 }
      );
    }

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data.error ||
            'No se pudo eliminar la evaluación de Google Drive.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Google Drive tardó demasiado en responder. No se confirmó la eliminación; vuelve a intentarlo.',
        },
        { status: 504 }
      );
    }

    console.error('Error eliminando evaluación de Google Drive:', error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al eliminar la evaluación.',
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}