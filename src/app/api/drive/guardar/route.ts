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

    if (!body?.evaluacion) {
      return NextResponse.json(
        { ok: false, error: 'No se recibió la evaluación.' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        accion: 'guardarEvaluacion',
        evaluacion: body.evaluacion,
        excelBase64: body.excelBase64 || null,
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
      reemplazados?: { json?: number; excel?: number };
      json?: { id: string; nombre: string } | null;
      excel?: { id: string; nombre: string } | null;
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
          error: data.error || 'Apps Script no pudo guardar la evaluación.',
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
            'Google Drive tardó demasiado en responder. Tus datos siguen en borrador; puedes volver a intentarlo.',
        },
        { status: 504 }
      );
    }

    console.error('Error guardando en Google Drive:', error);

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
  } finally {
    clearTimeout(timeout);
  }
}