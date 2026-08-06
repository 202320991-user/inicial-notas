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

/** Tabla que imita visualmente el layout de la plantilla física, usada tanto en
 * /competencia/[id]/vista-previa (mientras se edita) como en el modal "Ver" del Drive
 * (para una ficha ya guardada). */
export function VistaPreviaExcel({
  actividad,
  fecha,
  competenciaTexto,
  capacidadesTexto,
  criterio,
  items,
  ninos,
}: VistaPreviaExcelProps) {
  const columnas = Array.from({ length: MAX_NINOS }, (_, i) => ninos[i]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
      <table className="min-w-full border-collapse text-xs">
        <tbody>
          <tr>
            <td colSpan={8} className="border border-slate-200 p-2 font-bold bg-white">
              ACTIVIDAD: {actividad || <span className="italic text-slate-300 font-normal">(sin nombre)</span>}
            </td>
          </tr>
          <tr>
            <td colSpan={8} className="border border-slate-200 p-2 bg-white">
              FECHA: {fecha || <span className="italic text-slate-300">(sin fecha)</span>}
            </td>
          </tr>
          
          {/* Bloque oficial: Competencia, Capacidades y Criterio (Fila 5 equivalente) */}
          {(competenciaTexto || capacidadesTexto || criterio) && (
            <tr>
              <td colSpan={3} className="border border-slate-200 p-2 align-top bg-slate-50">
                <span className="block text-[10px] font-bold text-slate-400 mb-0.5">COMPETENCIA</span>
                {competenciaTexto || <span className="text-slate-300 italic">(sin competencia)</span>}
              </td>
              <td colSpan={2} className="border border-slate-200 p-2 align-top bg-slate-50">
                <span className="block text-[10px] font-bold text-slate-400 mb-0.5">CAPACIDADES</span>
                {capacidadesTexto || <span className="text-slate-300 italic">(sin capacidades)</span>}
              </td>
              <td colSpan={3} className="border border-slate-200 p-2 align-top bg-slate-50">
                <span className="block text-[10px] font-bold text-slate-400 mb-0.5">CRITERIO DE EVALUACIÓN</span>
                {criterio || <span className="italic text-slate-300">(sin criterio)</span>}
              </td>
            </tr>
          )}

          {/* Encabezado de indicadores y nombres de los niños */}
          <tr className="bg-slate-100 font-semibold">
            <td colSpan={3} className="border border-slate-200 p-2">
              Indicadores de evaluación
            </td>
            {columnas.map((n, i) => (
              <td key={i} className="border border-slate-200 p-2 text-center">
                {n?.nombre || <span className="text-slate-300 font-normal">—</span>}
              </td>
            ))}
          </tr>

          {/* Lista de indicadores y calificaciones de los niños */}
          {items.map((texto, idx) => (
            <tr key={idx}>
              <td colSpan={3} className="border border-slate-200 p-2 align-top">
                {texto || <span className="text-slate-300 italic">(indicador vacío)</span>}
              </td>
              {columnas.map((n, i) => {
                const valor = n?.calificaciones[idx] || '';
                return (
                  <td key={i} className={`border border-slate-200 p-2 text-center font-bold ${colorCeldaNivel(valor)}`}>
                    {valor}
                  </td>
                );
              })}
            </tr>
          ))}

          <tr>
            <td colSpan={8} className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-600">
              Leyenda: L = Logrado &nbsp;·&nbsp; EP = En Proceso &nbsp;·&nbsp; I = En Inicio
            </td>
          </tr>
          <tr>
            <td colSpan={8} className="border border-slate-200 p-2 bg-slate-50 font-semibold text-slate-600">
              Registro descriptivo
            </td>
          </tr>
          <tr className="bg-slate-100 font-semibold">
            <td className="border border-slate-200 p-2">Niño</td>
            <td className="border border-slate-200 p-2">Nivel</td>
            <td colSpan={6} className="border border-slate-200 p-2">
              Observación
            </td>
          </tr>

          {/* Detalle del registro descriptivo por cada niño */}
          {columnas.map((n, i) => (
            <tr key={i}>
              <td className="border border-slate-200 p-2">{n?.nombre || ''}</td>
              <td className={`border border-slate-200 p-2 text-center font-bold ${n?.nivelAlcanzado ? claseNivelBadge(n.nivelAlcanzado) : ''}`}>
                {n?.nivelAlcanzado || ''}
              </td>
              <td colSpan={6} className="border border-slate-200 p-2">
                {n?.observacionDescriptiva || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}