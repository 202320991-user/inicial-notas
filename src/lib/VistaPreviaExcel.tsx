import { NinoGuardado, Nivel } from '@/types';
import { claseNivelBadge } from '@/lib/ui';
import { MAX_NINOS } from '@/lib/competencias';

function colorCeldaNivel(nivel: Nivel): string {
  if (nivel === 'L') return 'bg-green-100 text-green-700';
  if (nivel === 'EP') return 'bg-amber-100 text-amber-700';
  if (nivel === 'I') return 'bg-red-100 text-red-700';
  return 'text-slate-300';
}

export interface VistaPreviaExcelProps {
  actividad: string;
  fecha: string;
  competenciaTexto?: string;
  capacidadesTexto?: string;
  criterio: string;
  items: string[];
  ninos: NinoGuardado[];
}

/**
 * Vista previa visual de la ficha Excel.
 *
 * IMPORTANTE:
 * El bloque superior (Competencia / Capacidades / Criterio)
 * NO usa la misma tabla de indicadores.
 *
 * Eso evita que los nombres de los niños y las columnas de
 * calificaciones deformen los anchos del bloque superior.
 */
export function VistaPreviaExcel({
  actividad,
  fecha,
  competenciaTexto,
  capacidadesTexto,
  criterio,
  items,
  ninos,
}: VistaPreviaExcelProps) {
  const columnas = Array.from(
    { length: MAX_NINOS },
    (_, i) => ninos[i]
  );

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-xs text-slate-700">
      {/* =======================================================
          DATOS GENERALES
      ======================================================= */}
      <div className="border-b border-slate-200 px-3 py-2 font-bold text-slate-800">
        ACTIVIDAD:{' '}
        <span className="font-semibold">
          {actividad || (
            <span className="italic text-slate-300">
              (sin nombre)
            </span>
          )}
        </span>
      </div>

      <div className="border-b border-slate-200 px-3 py-2 font-bold text-slate-700">
        FECHA:{' '}
        <span className="font-normal">
          {fecha || (
            <span className="italic text-slate-300">
              (sin fecha)
            </span>
          )}
        </span>
      </div>

      {/* =======================================================
          BLOQUE SUPERIOR

          Separamos esta zona de la tabla de alumnos para que
          los anchos sean independientes y estables.

          Proporciones:
          Competencia = 38%
          Capacidades = 27%
          Criterio = 35%
      ======================================================= */}
      {(competenciaTexto || capacidadesTexto || criterio) && (
        <div className="grid grid-cols-[1.08fr_0.92fr_1fr] border-b border-slate-200 bg-slate-50">
          {/* COMPETENCIA */}
          <div className="min-w-0 border-r border-slate-200 p-3 align-top">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              COMPETENCIA
            </span>

            <div className="whitespace-normal break-words text-[11px] leading-[1.4] text-slate-700">
              {competenciaTexto || (
                <span className="italic text-slate-300">
                  (sin competencia)
                </span>
              )}
            </div>
          </div>

          {/* CAPACIDADES */}
          <div className="min-w-0 border-r border-slate-200 p-3 align-top">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              CAPACIDADES
            </span>

            <div className="whitespace-normal break-words text-[11px] leading-[1.45] text-slate-700">
              {capacidadesTexto || (
                <span className="italic text-slate-300">
                  (sin capacidades)
                </span>
              )}
            </div>
          </div>

          {/* CRITERIO */}
          <div className="min-w-0 p-3 align-top">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              CRITERIO DE EVALUACIÓN
            </span>

            <div className="whitespace-normal break-words text-[11px] leading-[1.45] text-slate-700">
              {criterio || (
                <span className="italic text-slate-300">
                  (sin criterio)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MATRIZ DE INDICADORES
      ======================================================= */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse">
          <colgroup>
            {/* Indicadores */}
            <col style={{ width: '50%' }} />

            {/* 5 niños */}
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>

          <tbody>
            {/* Encabezado */}
            <tr className="bg-slate-100 font-semibold">
              <td className="border-b border-r border-slate-200 p-2">
                Indicadores de evaluación
              </td>

              {columnas.map((n, i) => (
                <td
                  key={i}
                  className="border-b border-r border-slate-200 p-2 text-center align-middle last:border-r-0"
                >
                  <div className="break-words text-[10px] font-semibold leading-tight">
                    {n?.nombre || (
                      <span className="font-normal text-slate-300">
                        —
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Indicadores + niveles */}
            {items.map((texto, idx) => (
              <tr key={idx}>
                <td className="border-b border-r border-slate-200 p-2 align-top">
                  <div className="break-words leading-snug">
                    {texto || (
                      <span className="italic text-slate-300">
                        (indicador vacío)
                      </span>
                    )}
                  </div>
                </td>

                {columnas.map((n, i) => {
                  const valor =
                    n?.calificaciones[idx] || '';

                  return (
                    <td
                      key={i}
                      className={`border-b border-r border-slate-200 p-2 text-center align-middle font-bold last:border-r-0 ${colorCeldaNivel(
                        valor
                      )}`}
                    >
                      {valor}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Leyenda */}
            <tr>
              <td
                colSpan={6}
                className="border-b border-slate-200 bg-slate-50 p-2 font-semibold text-slate-600"
              >
                Leyenda: L = Logrado &nbsp;·&nbsp; EP = En Proceso
                &nbsp;·&nbsp; I = En Inicio
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* =======================================================
          REGISTRO DESCRIPTIVO
      ======================================================= */}
      <div className="border-b border-slate-200 bg-slate-50 p-2 font-semibold text-slate-600">
        Registro descriptivo
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[620px] table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '60%' }} />
          </colgroup>

          <tbody>
            <tr className="bg-slate-100 font-semibold">
              <td className="border-b border-r border-slate-200 p-2">
                Niño
              </td>

              <td className="border-b border-r border-slate-200 p-2 text-center">
                Nivel
              </td>

              <td className="border-b border-slate-200 p-2">
                Observación
              </td>
            </tr>

            {columnas.map((n, i) => (
              <tr key={i}>
                <td className="border-b border-r border-slate-200 p-2 align-middle">
                  <div className="break-words leading-snug">
                    {n?.nombre || ''}
                  </div>
                </td>

                <td
                  className={`border-b border-r border-slate-200 p-2 text-center align-middle font-bold ${
                    n?.nivelAlcanzado
                      ? claseNivelBadge(n.nivelAlcanzado)
                      : ''
                  }`}
                >
                  {n?.nivelAlcanzado || ''}
                </td>

                <td className="border-b border-slate-200 p-2 align-top">
                  <div className="break-words leading-snug">
                    {n?.observacionDescriptiva || ''}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}