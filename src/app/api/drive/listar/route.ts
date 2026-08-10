import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = process.env.APPS_SCRIPT_URL;

    if (!url) {
      return NextResponse.json(
        {
          ok: false,
          error: 'APPS_SCRIPT_URL no está configurada.',
        },
        { status: 500 }
      );
    }

    const endpoint =
      `${url}?accion=listarEvaluaciones`;

    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
    });

    const texto = await response.text();

    let data;

    try {
      data = JSON.parse(texto);
    } catch {
      console.error(
        'Respuesta no JSON de Apps Script:',
        texto
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            'Apps Script respondió con un formato inesperado.',
        },
        { status: 502 }
      );
    }

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data.error ||
            'No se pudieron obtener las evaluaciones de Google Drive.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      total: data.total || 0,
      evaluaciones: data.evaluaciones || [],
    });
  } catch (error) {
    console.error(
      'Error listando evaluaciones desde Google Drive:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al consultar Google Drive.',
      },
      { status: 500 }
    );
  }
}