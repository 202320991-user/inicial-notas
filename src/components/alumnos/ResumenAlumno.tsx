import { Alumno } from '@/types';
import { HistorialAlumnoItem } from '@/lib/historialAlumno';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Props {
  alumno: Alumno;
  historial: HistorialAlumnoItem[];
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

export function ResumenAlumno({
  alumno,
  historial,
}: Props) {
  const [abiertoId, setAbiertoId] =
    useState<string | null>(null);

  const competencias = new Set(
    historial.map(
      (item) => item.competenciaId
    )
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Evaluaciones
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {historial.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Competencias
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {competencias.size}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900">
          Historial completo de {alumno.nombre}
        </h4>

        <p className="mt-1 text-xs text-slate-400">
          Vista previa de todas sus evaluaciones
        </p>
      </div>

      <div className="space-y-3">
        {historial.map((item) => {
          const abierto =
            abiertoId ===
            item.evaluacionId;

          return (
            <div
              key={item.evaluacionId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() =>
                  setAbiertoId(
                    abierto
                      ? null
                      : item.evaluacionId
                  )
                }
                className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {item.actividad}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.competenciaNombre}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.fecha
                      ? item.fecha
                          .split('-')
                          .reverse()
                          .join('/')
                      : 'Sin fecha'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${claseNivel(
                      item.nivelAlcanzado
                    )}`}
                  >
                    {item.nivelAlcanzado ||
                      '—'}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      abierto
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </div>
              </button>

              {abierto && (
                <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
                  {item.indicadores.map(
                    (indicador, index) => {
                      const nivel =
                        item
                          .calificaciones[
                          index
                        ] || '';

                      return (
                        <div
                          key={index}
                          className="flex items-start justify-between gap-3"
                        >
                          <p className="text-xs leading-relaxed text-slate-600">
                            {indicador}
                          </p>

                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${claseNivel(
                              nivel
                            )}`}
                          >
                            {nivel ||
                              '—'}
                          </span>
                        </div>
                      );
                    }
                  )}

                  {item.observacionDescriptiva && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Observación
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {
                          item.observacionDescriptiva
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}