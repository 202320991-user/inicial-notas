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

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Apps Script respondió con estado ${response.status}`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      appsScript: data,
    });
  } catch (error) {
    console.error('Error conectando con Apps Script:', error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido.',
      },
      { status: 500 }
    );
  }
}