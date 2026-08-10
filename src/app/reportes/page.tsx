'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { useEvaluaciones } from '@/lib/useEvaluaciones';
import { COMPETENCIAS } from '@/lib/competencias';
import { obtenerIniciales } from '@/lib/ui';
import { useHydrated } from '@/lib/useHydrated';
import { 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Search, 
  UserCheck,
  CalendarDays
} from 'lucide-react';

const REGISTROS_NECESARIOS_POR_COMPETENCIA = 3;
type PeriodoFiltro = 'mes' | 'bimestre';

export default function ReportesPage() {
  const { listaAlumnos } = useListaAlumnos();
  const { evaluaciones } = useEvaluaciones();
  
  const montado = useHydrated();
  const [busqueda, setBusqueda] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('bimestre');

  // Filtrar alumnos según la barra de búsqueda (nombre o DNI)
  const alumnosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return listaAlumnos;
    return listaAlumnos.filter(
      (a) =>
        a.nombre.toLowerCase().includes(query) ||
        (a.dni && a.dni.toLowerCase().includes(query))
    );
  }, [listaAlumnos, busqueda]);

  const totalAlumnos = listaAlumnos.length;

  // Ajustar metas y ponderaciones según el filtro de tiempo seleccionado
  const metaConfig = useMemo(() => {
    switch (periodoFiltro) {
      case 'mes':
        // Meta a la mitad del periodo (1 mes / 2 meses)
        return { divisorMeta: 2, maxRegistrosPorComp: REGISTROS_NECESARIOS_POR_COMPETENCIA / 2 };
      case 'bimestre':
      default:
        // Meta completa de los 2 meses (27 registros totales por alumno: 9 comp * 3 reg)
        return { divisorMeta: 1, maxRegistrosPorComp: REGISTROS_NECESARIOS_POR_COMPETENCIA };
    }
  }, [periodoFiltro]);

  // Mapear el progreso real por alumno adaptado al filtro de tiempo
  const obtenerProgresoAlumno = (alumnoId: string, nombreAlumno: string) => {
    const areasUnicas = Array.from(new Set(COMPETENCIAS.map((c) => c.area)));
    const resultado: Record<string, number> = {};

    let totalRegistrosAlumno = 0;
    let totalMaximoAlumno = 0;

    areasUnicas.forEach((area) => {
      const compsArea = COMPETENCIAS.filter((c) => c.area === area);
      const compIdsArea = compsArea.map((c) => c.id);
      
      const maxRegistrosArea = (compsArea.length * REGISTROS_NECESARIOS_POR_COMPETENCIA) / metaConfig.divisorMeta;
      totalMaximoAlumno += maxRegistrosArea;

      let registrosValidosArea = 0;

      evaluaciones.forEach((ev) => {
        if (compIdsArea.includes(ev.competenciaId)) {
          const participacion = ev.ninos.find(
            (n) =>
              n.alumnoId === alumnoId ||
              n.nombre.toLowerCase().trim() === nombreAlumno.toLowerCase().trim()
          );
          if (participacion && (participacion.nivelAlcanzado || Object.keys(participacion.calificaciones || {}).length > 0)) {
            registrosValidosArea++;
          }
        }
      });

      totalRegistrosAlumno += registrosValidosArea;
      const porcentajeArea = maxRegistrosArea > 0 ? (registrosValidosArea / maxRegistrosArea) * 100 : 0;
      resultado[area] = Math.min(100, Math.round(porcentajeArea));
    });

    const porcentajeTotal = totalMaximoAlumno > 0 ? Math.min(100, Math.round((totalRegistrosAlumno / totalMaximoAlumno) * 100)) : 0;

    return {
      porAreas: resultado,
      porcentajeTotal,
      completado: totalRegistrosAlumno >= totalMaximoAlumno
    };
  };

  const alumnosEvaluadosIds = useMemo(() => {
    const evaluadosSet = new Set<string>();
    listaAlumnos.forEach((alumno) => {
      const progreso = obtenerProgresoAlumno(alumno.id, alumno.nombre);
      if (progreso.completado) {
        evaluadosSet.add(alumno.id);
      }
    });
    return evaluadosSet;
  }, [evaluaciones, listaAlumnos, metaConfig]);

  const evaluadosTotal = alumnosEvaluadosIds.size;
  const evaluacionesPendientes = Math.max(0, totalAlumnos - evaluadosTotal);
  
  const avanceGeneral = totalAlumnos > 0 
    ? Math.round(listaAlumnos.reduce((acc, alumno) => acc + obtenerProgresoAlumno(alumno.id, alumno.nombre).porcentajeTotal, 0) / totalAlumnos) 
    : 0;

  if (!montado) {
    return (
      <main className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-400 text-sm max-w-7xl mx-auto">
        Cargando reportes...
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800 font-sans max-w-7xl mx-auto space-y-6">
      
      {/* Cabecera y Selector de Periodo Temporal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Reportes de Progreso Académico
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de avance de los registros requeridos por competencia según el periodo.
          </p>
        </div>

        {/* Botones de Filtro de Tiempo (Mes y Bimestre) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/60">
          <CalendarDays className="w-4 h-4 text-slate-400 ml-2 mr-1 hidden sm:block" />
          <button
            type="button"
            onClick={() => setPeriodoFiltro('mes')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              periodoFiltro === 'mes' 
                ? 'bg-white text-[#006492] shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1 Mes
          </button>
          <button
            type="button"
            onClick={() => setPeriodoFiltro('bimestre')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              periodoFiltro === 'bimestre' 
                ? 'bg-white text-[#006492] shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bimestre
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Alumnos</span>
            <p className="text-2xl font-extrabold text-slate-900">{totalAlumnos}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#006492] flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Meta Cumplida</span>
            <p className="text-2xl font-extrabold text-slate-900">{evaluadosTotal}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Incompletos</span>
            <p className="text-2xl font-extrabold text-slate-900">{evaluacionesPendientes}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avance Promedio</span>
            <p className="text-xs font-extrabold text-[#006492]">
              {periodoFiltro === 'bimestre' ? 'Meta: 27 Registros' : 'Meta: 1 Mes'}
            </p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <span className="text-xs font-bold text-slate-900">{avanceGeneral}%</span>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Estudiantes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <h2 className="font-bold text-base text-slate-900">Listado de Estudiantes</h2>
            <p className="text-[11px] text-slate-400">Mostrando métricas ajustadas al filtro: <span className="font-semibold text-slate-600 uppercase">{periodoFiltro}</span></p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#006492]"
              />
            </div>
            
            <button 
              type="button"
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Alumno</th>
                <th className="p-4">DNI</th>
                <th className="p-4">Progreso por Áreas</th>
                <th className="p-4">Estado del Periodo</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alumnosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No se encontraron estudiantes registrados.
                  </td>
                </tr>
              ) : (
                alumnosFiltrados.map((alumno) => {
                  const datosProgreso = obtenerProgresoAlumno(alumno.id, alumno.nombre);
                  const estaCompleto = datosProgreso.completado;

                  return (
                    <tr key={alumno.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#006492] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {obtenerIniciales(alumno.nombre)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{alumno.nombre}</p>
                            <p className="text-[11px] text-slate-400">Avance: {datosProgreso.porcentajeTotal}%</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{alumno.dni || '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          {Object.entries(datosProgreso.porAreas).map(([nombreArea, porcentaje]) => {
                            const sigla = nombreArea.substring(0, 4).toUpperCase();
                            return (
                              <div key={nombreArea} className="min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-600 block mb-1">{sigla} ({porcentaje}%)</span>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-[#006492] h-full rounded-full transition-all" 
                                    style={{ width: `${porcentaje}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        {estaCompleto ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Meta Cumplida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            En Proceso
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/drive?alumnoId=${alumno.id}`}
                          className="text-[#006492] font-bold hover:underline text-xs"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
