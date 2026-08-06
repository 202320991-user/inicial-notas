'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, ArrowLeft, Save, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useFicha } from '@/lib/useFicha';
import { VistaPreviaExcel } from '@/components/VistaPreviaExcel';

export default function VistaPreviaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const evaluacionId = useSearchParams().get('evaluacionId') || undefined;
  const f = useFicha(id, evaluacionId);
  const [descargando, setDescargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState('');

  if (f.error) {
    return (
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{f.error}</p>
      </main>
    );
  }

  if (f.cargando) {
    return (
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <p className="text-sm text-slate-400">Cargando plantilla...</p>
      </main>
    );
  }

  const advertencias = f.obtenerAdvertencias();

  const descargar = async () => {
    setDescargando(true);
    try {
      await f.exportar(false);
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al generar el archivo. Revisa la consola para más detalles.');
    } finally {
      setDescargando(false);
    }
  };

  const guardarEnDrive = () => {
    setGuardando(true);
    try {
      const eraActualizacion = !!f.evaluacionIdActual;
      f.guardarEnDrive();
      f.finalizarSesion();
      setToast(eraActualizacion ? 'Evaluación actualizada en el Drive ✓' : 'Evaluación guardada en el Drive ✓');
      setTimeout(() => router.push('/drive'), 900);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Eye size={20} className="text-slate-500" /> Vista previa del Excel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Así se verá aproximadamente tu ficha impresa. Revísala antes de descargar para evitar errores.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/competencia/${id}/evaluar${evaluacionId ? `?evaluacionId=${evaluacionId}` : ''}`}
            className="text-sm font-semibold text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Seguir editando
          </Link>
          <button
            type="button"
            onClick={guardarEnDrive}
            disabled={guardando}
            className="text-sm font-semibold bg-white border border-[#006492] text-[#006492] hover:bg-[#e6f2f8] disabled:opacity-50 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Save size={16} /> {f.evaluacionIdActual ? 'Actualizar en el Drive' : 'Guardar en el Drive'}
          </button>
          <button
            type="button"
            onClick={descargar}
            disabled={descargando}
            className="text-sm font-semibold bg-[#006492] hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FileSpreadsheet size={16} /> {descargando ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>
      </div>

      {toast && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">{toast}</div>}

      {advertencias.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle size={14} /> Antes de descargar, revisa lo siguiente:
          </p>
          <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
            {advertencias.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <VistaPreviaExcel
        actividad={f.actividad}
        fecha={f.fecha}
        competenciaTexto={f.competenciaTexto}
        capacidadesTexto={f.capacidadesTexto}
        criterio={f.criterio}
        items={f.items}
        ninos={f.ninos}
      />

      <p className="text-[11px] text-slate-400">
        Esta vista previa es una aproximación visual del contenido; el archivo Excel real conserva el formato oficial
        de la plantilla impresa.
      </p>
    </main>
  );
}