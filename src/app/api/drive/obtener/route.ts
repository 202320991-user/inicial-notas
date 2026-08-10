import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id')?.trim() || '';

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No se recibió el id de la evaluación.',
        },
        { status: 400 }
      );
    }

    const endpoint =
      `${url}?accion=obtenerEvaluacion&id=${encodeURIComponent(id)}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
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
            'No se pudo obtener la evaluación desde Google Drive.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      evaluacion: data.evaluacion,
    });
  } catch (error) {
    console.error(
      'Error obteniendo evaluación desde Google Drive:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al obtener la evaluación.',
      },
      { status: 500 }
    );
  }
}