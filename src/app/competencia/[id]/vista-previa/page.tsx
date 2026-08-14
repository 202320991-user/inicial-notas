'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import {
  ArrowLeft,
  Save,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

import { useFicha } from '@/lib/useFicha';
import { VistaPreviaExcel } from '@/components/VistaPreviaExcel';

export default function VistaPreviaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const evaluacionId =
    useSearchParams().get('evaluacionId') ||
    undefined;

  const f = useFicha(
    id,
    evaluacionId
  );

  const [descargando, setDescargando] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [toast, setToast] =
    useState('');

  const [
    errorGuardado,
    setErrorGuardado,
  ] = useState('');

  if (f.error) {
    return (
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {f.error}
        </div>
      </main>
    );
  }

  if (f.cargando) {
    return (
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="text-sm text-slate-400">
          Cargando plantilla...
        </div>
      </main>
    );
  }

  const advertencias =
    f.obtenerAdvertencias();

  /**
   * Descargar solamente en la computadora.
   */
  const descargar = async () => {
    if (descargando) return;

    setDescargando(true);

    try {
      await f.exportar(false);
    } catch (e) {
      console.error(
        'Error generando Excel:',
        e
      );

      alert(
        'Ocurrió un error al generar el archivo. Revisa la consola para más detalles.'
      );
    } finally {
      setDescargando(false);
    }
  };

  /**
   * Guardar la evaluación real:
   *
   * Next.js
   * → generar Excel Base64
   * → /api/drive/guardar
   * → Apps Script
   * → Google Drive
   *
   * IMPORTANTE:
   * No limpiamos la sesión hasta que Google Drive
   * confirme correctamente el guardado.
   */
  const guardarEnDrive = async () => {
    if (guardando) return;

    setGuardando(true);
    setToast('');
    setErrorGuardado('');

    const eraActualizacion =
      !!f.evaluacionIdActual;

    try {
      const resultado =
        await f.guardarEnDrive();

      console.log(
        'Guardado en Google Drive:',
        resultado
      );

      /**
       * Llegados aquí significa que:
       *
       * - el JSON se guardó
       * - el Excel se guardó
       * - Apps Script respondió ok
       *
       * Ahora sí podemos limpiar la sesión.
       */
      f.finalizarSesion();

      setToast(
        eraActualizacion
          ? 'Evaluación actualizada en Google Drive ✓'
          : 'Evaluación guardada en Google Drive ✓'
      );

      /**
       * Dejamos visible el mensaje unos instantes
       * antes de ir al gestor.
       */
      setTimeout(() => {
        router.push('/drive');
      }, 1200);
    } catch (error) {
      console.error(
        'Error guardando en Google Drive:',
        error
      );

      const mensaje =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error desconocido al guardar en Google Drive.';

      /**
       * IMPORTANTE:
       * Si falla Drive NO ejecutamos finalizarSesion().
       *
       * Así el docente no pierde la evaluación
       * que estaba intentando guardar.
       */
      setErrorGuardado(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-5">
      {/* =======================================================
          CABECERA
      ======================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Vista previa del Excel
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Así se verá aproximadamente tu ficha impresa.
            Revísala antes de descargar para evitar errores.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Volver a editar */}
          <Link
            href={`/competencia/${id}/evaluar${
              evaluacionId
                ? `?evaluacionId=${evaluacionId}`
                : ''
            }`}
            className="text-sm font-semibold text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Seguir editando
          </Link>

          {/* Guardar en Google Drive */}
          <button
            type="button"
            onClick={guardarEnDrive}
            disabled={
              guardando ||
              descargando
            }
            className="text-sm font-semibold bg-[#006492] text-white px-4 py-2 rounded-lg hover:bg-[#005278] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Save size={16} />

            {guardando
              ? 'Guardando en Drive...'
              : f.evaluacionIdActual
                ? 'Actualizar en el Drive'
                : 'Guardar en el Drive'}
          </button>

          {/* Descargar Excel */}
          <button
            type="button"
            onClick={descargar}
            disabled={
              descargando ||
              guardando
            }
            className="text-sm font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet
              size={16}
            />

            {descargando
              ? 'Generando...'
              : 'Descargar Excel'}
          </button>
        </div>
      </div>

      {/* =======================================================
          MENSAJE DE ÉXITO
      ======================================================= */}
      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
          {toast}
        </div>
      )}

      {/* =======================================================
          ERROR DE GOOGLE DRIVE
      ======================================================= */}
      {errorGuardado && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          <p className="font-semibold">
            No se pudo guardar en Google Drive.
          </p>

          <p className="mt-1 text-xs leading-relaxed">
            {errorGuardado}
          </p>

          <p className="mt-2 text-xs text-red-600">
            Tus datos no fueron borrados. Puedes volver a intentarlo.
          </p>
        </div>
      )}

      {/* =======================================================
          ADVERTENCIAS
      ======================================================= */}
      {advertencias.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle
              size={14}
            />

            Antes de descargar o guardar, revisa lo siguiente:
          </p>

          <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
            {advertencias.map(
              (advertencia, i) => (
                <li key={i}>
                  {advertencia}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* =======================================================
          VISTA PREVIA
      ======================================================= */}
      <VistaPreviaExcel
        actividad={f.actividad}
        unidad={f.unidad}
        fecha={f.fecha}
        competenciaTexto={
          f.competenciaTexto
        }
        capacidadesTexto={
          f.capacidadesTexto
        }
        criterio={f.criterio}
        items={f.items}
        ninos={f.ninos}
      />

      <p className="text-[11px] text-slate-400">
        Esta vista previa es una aproximación visual del contenido; el archivo Excel real conserva el formato oficial de la plantilla impresa.
      </p>
    </main>
  );
}