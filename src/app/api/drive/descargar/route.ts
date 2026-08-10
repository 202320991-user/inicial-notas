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

    /**
     * Pedimos a Apps Script el Excel real guardado en Drive.
     */
    const endpoint =
      `${url}?accion=descargarExcel&id=${encodeURIComponent(id)}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
    });

    const texto = await response.text();

    let data: {
      ok?: boolean;
      error?: string;
      archivo?: {
        id?: string;
        nombre?: string;
        mimeType?: string;
        base64?: string;
      };
    };

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

    if (
      !response.ok ||
      !data.ok ||
      !data.archivo
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data.error ||
            'No se pudo obtener el Excel desde Google Drive.',
        },
        { status: 502 }
      );
    }

    const archivo = data.archivo;

    if (!archivo.base64) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Google Drive no devolvió el contenido del Excel.',
        },
        { status: 502 }
      );
    }

    /**
     * Convertimos Base64 → Buffer.
     *
     * Esto ocurre del lado servidor de Next.js.
     */
    const buffer = Buffer.from(
      archivo.base64,
      'base64'
    );

    /**
     * Nombre original del archivo.
     */
    const nombreArchivo =
      archivo.nombre?.trim() ||
      `evaluacion_${id}.xlsx`;

    const mimeType =
      archivo.mimeType ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    /**
     * Devolvemos directamente el archivo Excel.
     *
     * El navegador interpretará esta respuesta
     * como una descarga.
     */
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,

        'Content-Disposition':
          `attachment; filename="${encodeURIComponent(nombreArchivo)}"`,

        'Content-Length':
          buffer.length.toString(),

        'Cache-Control':
          'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error(
      'Error descargando Excel desde Google Drive:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al descargar el Excel.',
      },
      { status: 500 }
    );
  }
}