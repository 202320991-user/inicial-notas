import { HistorialAlumnoItem } from '@/lib/historialAlumno';
import { ArrowLeft } from 'lucide-react';

interface Props {
  item: HistorialAlumnoItem;
  onVolver: () => void;
}

function claseNivel(
  nivel: string
): string {
  if (nivel === 'L') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (nivel === 'EP') {
    return 'bg-amber-100 text-amber-700';
  }

  if (nivel === 'I') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-slate-100 text-slate-500';
}

export function DetalleEvaluacionAlumno({
  item,
  onVolver,
}: Props) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onVolver}
        className="flex items-center gap-2 text-xs font-semibold text-[#006492] hover:underline"
      >
        <ArrowLeft size={15} />
        Volver al historial
      </button>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {item.area}
        </p>

        <h3 className="mt-1 text-lg font-bold text-slate-900">
          {item.actividad}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {item.competenciaNombre}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {item.fecha
            ? item.fecha
                .split('-')
                .reverse()
                .join('/')
            : 'Sin fecha'}
        </p>
      </div>

      {item.unidad && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Unidad
          </p>

          <p className="mt-1 text-sm text-slate-700">
            {item.unidad}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <span className="text-sm font-semibold text-slate-700">
          Nivel alcanzado
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${claseNivel(
            item.nivelAlcanzado
          )}`}
        >
          {item.nivelAlcanzado || '—'}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Indicadores
        </p>

        <div className="space-y-2">
          {item.indicadores.map(
            (indicador, index) => {
              const nivel =
                item.calificaciones[index] ||
                '';

              return (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <p className="flex-1 text-xs leading-relaxed text-slate-700">
                    {indicador}
                  </p>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${claseNivel(
                      nivel
                    )}`}
                  >
                    {nivel || '—'}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Registro descriptivo
        </p>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {item.observacionDescriptiva ||
            'Sin observación descriptiva.'}
        </p>
      </div>
    </div>
  );
}