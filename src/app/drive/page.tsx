'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEvaluaciones } from '@/lib/useEvaluaciones';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { COMPETENCIAS, getCompetencia } from '@/lib/competencias';
import { agruparPorArea, colorDeArea, obtenerIniciales } from '@/lib/ui';
import { generarExcelEvaluacion } from '@/lib/excel';
import { generarReporteAlumno } from '@/lib/reporteAlumno';
import { coincideAlumno } from '@/lib/alumnoMatch';
import { VistaPreviaExcel } from '@/components/VistaPreviaExcel';
import { CONTENIDO_OFICIAL } from '@/lib/contenidoOficial';
import { EvaluacionGuardada, MoldeGuardado, RegistroAlumno } from '@/types';

import { 
  BarChart2, 
  Calculator, 
  History, 
  Search, 
  LayoutGrid, 
  List, 
  Eye, 
  Download, 
  Pencil, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  X,
  Users
} from 'lucide-react';

const AREAS = agruparPorArea(COMPETENCIAS);

type PresetFecha = 'todo' | 'este_bimestre' | 'b1' | 'b2' | 'b3' | 'b4';

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function DriveContenido() {
  const searchParams = useSearchParams();
  const { evaluaciones, cargado, error: errorDrive, eliminar } = useEvaluaciones();
  const { listaAlumnos } = useListaAlumnos();

  const [texto, setTexto] = useState('');
  const [area, setArea] = useState('');
  const [competenciaId, setCompetenciaId] = useState('');
  const [alumnoId, setAlumnoId] = useState('');
  const [preset, setPreset] = useState<PresetFecha>('todo');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [verEvaluacion, setVerEvaluacion] = useState<EvaluacionGuardada | null>(null);
  const [porEliminar, setPorEliminar] = useState<EvaluacionGuardada | null>(null);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  
  const [hoveredAlumnosId, setHoveredAlumnosId] = useState<string | null>(null);

  useEffect(() => {
    const desdeUrl = searchParams.get('alumnoId');
    if (desdeUrl) setAlumnoId(desdeUrl);
  }, [searchParams]);

  const competenciasDelArea = useMemo(() => (area ? COMPETENCIAS.filter((c) => c.area === area) : COMPETENCIAS), [area]);
  const alumnoActivo = useMemo(() => listaAlumnos.find((a) => a.id === alumnoId), [listaAlumnos, alumnoId]);

  const aplicarPreset = (nuevo: PresetFecha) => {
    setPreset(nuevo);
    const hoy = new Date();
    const anio = hoy.getFullYear();

    if (nuevo === 'todo') {
      setDesde('');
      setHasta('');
    } else if (nuevo === 'este_bimestre') {
      const mesActual = hoy.getMonth();
      const mesInicio = mesActual - (mesActual % 2);
      const primerDia = new Date(anio, mesInicio, 1);
      const ultimoDia = new Date(anio, mesInicio + 2, 0);
      setDesde(fechaISO(primerDia));
      setHasta(fechaISO(ultimoDia));
    } else if (nuevo === 'b1') {
      setDesde(`${anio}-03-01`);
      setHasta(`${anio}-05-15`);
    } else if (nuevo === 'b2') {
      setDesde(`${anio}-05-16`);
      setHasta(`${anio}-07-31`);
    } else if (nuevo === 'b3') {
      setDesde(`${anio}-08-01`);
      setHasta(`${anio}-10-15`);
    } else if (nuevo === 'b4') {
      setDesde(`${anio}-10-16`);
      setHasta(`${anio}-12-31`);
    }
  };

  const limpiarFiltros = () => {
    setTexto('');
    setArea('');
    setCompetenciaId('');
    setAlumnoId('');
    aplicarPreset('todo');
  };

  const filtradas = useMemo(() => {
    const textoBusqueda = texto.trim().toLowerCase();
    
    return evaluaciones
      .filter((ev) => {
        if (textoBusqueda) {
          const coincideTexto =
            (ev.tituloActividad || '').toLowerCase().includes(textoBusqueda) ||
            (ev.competenciaNombre || '').toLowerCase().includes(textoBusqueda) ||
            (ev.ninos || []).some((n) => (n.nombre || '').toLowerCase().includes(textoBusqueda));
          if (!coincideTexto) return false;
        }

        if (area && ev.areaNombre !== area) return false;
        if (competenciaId && ev.competenciaId !== competenciaId) return false;

        if (alumnoId) {
          if (!alumnoActivo) return false;

          const tieneAlumno = (ev.ninos || []).some((nino) =>
            coincideAlumno(alumnoActivo, nino)
          );

          if (!tieneAlumno) return false;
        }

        if (desde && ev.fecha && ev.fecha < desde) return false;
        if (hasta && ev.fecha && ev.fecha > hasta) return false;

        return true;
      })
      .sort((a, b) => {
        const fechaA = a.actualizadoEn || a.fecha || '';
        const fechaB = b.actualizadoEn || b.fecha || '';
        return fechaB.localeCompare(fechaA);
      });
  }, [evaluaciones, texto, area, competenciaId, alumnoId, alumnoActivo, desde, hasta]);

  const descargarDirecto = async (ev: EvaluacionGuardada) => {
    const compInfo = getCompetencia(ev.competenciaId);
    if (!compInfo) {
      alert('No se encontró la plantilla de esta competencia.');
      return;
    }
    setDescargandoId(ev.id);
    try {
      const molde: MoldeGuardado = {
        competenciaId: ev.competenciaId,
        unidad: ev.unidad || '',
        actividad: ev.tituloActividad,
        fecha: ev.fecha,
        criterio: ev.criterio,
        items: ev.indicadores,
        capacidadesTexto: ev.capacidadesTexto || '',
      };
      const registros: RegistroAlumno[] = (ev.ninos || []).map((n) => ({
        nombre: n.nombre,
        calificaciones: n.calificaciones,
        nivelAlcanzado: n.nivelAlcanzado,
        observacionDescriptiva: n.observacionDescriptiva,
      }));
      await generarExcelEvaluacion(compInfo.archivo, molde, registros);
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al generar el archivo.');
    } finally {
      setDescargandoId(null);
    }
  };

  const descargarReporteConsolidado = async () => {
    if (!alumnoActivo) return;
    setGenerandoReporte(true);
    try {
      await generarReporteAlumno(alumnoActivo, filtradas);
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al generar el reporte.');
    } finally {
      setGenerandoReporte(false);
    }
  };

  return (
    <main className="p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 font-sans max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Gestor de Evaluaciones Grupales
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Consulta, filtra y gestiona los registros de progreso por actividad pedagógica.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {alumnoActivo && (
              <button
                onClick={descargarReporteConsolidado}
                disabled={generandoReporte}
                className="flex-1 md:flex-none bg-white text-[#006492] border border-slate-200 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 text-sm"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>{generandoReporte ? 'Generando...' : 'Reporte Alumno'}</span>
              </button>
            )}
            <Link 
              href="/"
              className="flex-1 md:flex-none bg-[#006492] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#004d70] transition-all text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Evaluación</span>
            </Link>
          </div>
        </div>

        {alumnoActivo && (
          <div className="mb-6 bg-blue-50 border border-[#006492]/20 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-sm text-[#006492] font-semibold">
              <div className="w-8 h-8 rounded-full bg-[#006492] text-white text-xs font-bold flex items-center justify-center">
                {obtenerIniciales(alumnoActivo.nombre)}
              </div>
              <span>Filtrando por el alumno: <strong>{alumnoActivo.nombre}</strong></span>
              <button 
                type="button" 
                onClick={() => setAlumnoId('')} 
                className="p-1 hover:bg-blue-100 rounded-full transition-colors" 
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#006492] flex items-center justify-center shrink-0">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Evaluaciones</p>
              <p className="text-2xl font-bold text-slate-900">{evaluaciones.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtradas</p>
              <p className="text-2xl font-bold text-slate-900">{filtradas.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alumnos Lista</p>
              <p className="text-2xl font-bold text-slate-900">{listaAlumnos.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006492] text-xs text-slate-700 placeholder:text-slate-400 outline-none" 
              placeholder="Buscar por actividad, competencia o alumno..." 
              type="text" 
            />
          </div>

          <select 
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setCompetenciaId('');
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:ring-2 focus:ring-[#006492] cursor-pointer outline-none max-w-[180px]"
          >
            <option value="">Todas las áreas</option>
            {AREAS.map(([nombreArea]) => (
              <option key={nombreArea} value={nombreArea}>{nombreArea}</option>
            ))}
          </select>

          <select 
            value={competenciaId}
            onChange={(e) => setCompetenciaId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:ring-2 focus:ring-[#006492] cursor-pointer outline-none max-w-[200px]"
          >
            <option value="">Todas las competencias</option>
            {competenciasDelArea.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <select 
            value={alumnoId}
            onChange={(e) => setAlumnoId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:ring-2 focus:ring-[#006492] cursor-pointer outline-none max-w-[180px]"
          >
            <option value="">Todos los alumnos</option>
            {listaAlumnos.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>

          <button 
            type="button"
            onClick={limpiarFiltros}
            className="text-[#006492] text-xs font-bold hover:underline px-2"
          >
            Limpiar
          </button>

          <div className="ml-auto flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-[#006492] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-[#006492] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: 'todo', label: 'Todo' },
                { id: 'este_bimestre', label: 'Este Bimestre' },
                { id: 'b1', label: 'I Bim' },
                { id: 'b2', label: 'II Bim' },
                { id: 'b3', label: 'III Bim' },
                { id: 'b4', label: 'IV Bim' },
              ] as { id: PresetFecha; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => aplicarPreset(item.id)}
                className={`text-[11px] font-semibold rounded-lg px-3 py-1 transition-colors border ${
                  preset === item.id
                    ? 'bg-[#006492] text-white border-[#006492]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
            <span>Desde:</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPreset('todo');
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-700 outline-none"
            />
            <span>Hasta:</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPreset('todo');
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-700 outline-none"
            />
          </div>
        </div>
      </div>

      {errorDrive && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <p className="font-bold">No se pudieron cargar las evaluaciones de Google Drive.</p>
          <p className="mt-1 text-xs">{errorDrive}</p>
        </div>
      )}

      {!cargado ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          Cargando registros del Drive...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          {evaluaciones.length === 0
            ? 'Aún no has guardado ninguna evaluación en el Drive. Complétala y guarda desde la Vista Previa.'
            : 'Ninguna evaluación coincide con los filtros aplicados.'}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filtradas.map((ev) => {
            const color = colorDeArea(ev.areaNombre);
            const ninosValidos = (ev.ninos || []).filter(n => (n.nombre || '').trim() !== '');

            return (
              <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group relative">
                <div className="p-4 border-b border-slate-100 flex justify-between items-start gap-2">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${color.light} ${color.text}`}>
                      {ev.areaNombre}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-[#006492] transition-colors line-clamp-1">
                      {ev.tituloActividad || '(sin nombre)'}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    {ev.fecha ? ev.fecha.split('-').reverse().join('/') : '—'}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-xs text-slate-600 line-clamp-2">{ev.competenciaNombre}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-[#006492] bg-blue-50 px-2.5 py-1 rounded-full">
                      {ninosValidos.length} niños
                    </span>

                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredAlumnosId(ev.id)}
                      onMouseLeave={() => setHoveredAlumnosId(null)}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#006492] text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-[#004d70] transition-colors">
                        <Users className="w-4 h-4" />
                      </div>

                      {hoveredAlumnosId === ev.id && (
                        <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900 text-white text-xs rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-1.5 border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                            Alumnos Evaluados ({ninosValidos.length})
                          </p>
                          <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                            {ninosValidos.map((n, idx) => (
                              <div key={n.id || n.alumnoId || idx} className="text-slate-200 font-medium truncate py-0.5 px-1.5 rounded hover:bg-slate-800">
                                • {n.nombre}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-end gap-1 rounded-b-2xl">
                  <button 
                    type="button"
                    onClick={() => setVerEvaluacion(ev)} 
                    className="p-1.5 hover:bg-blue-50 text-[#006492] rounded-lg transition-colors" 
                    title="Ver Vista Previa"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => descargarDirecto(ev)} 
                    disabled={descargandoId === ev.id}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-50" 
                    title="Descargar Excel"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <Link 
                    href={`/competencia/${ev.competenciaId}/evaluar?evaluacionId=${ev.id}`}
                    className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors" 
                    title="Editar Registro"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                  <button 
                    type="button"
                    onClick={() => setPorEliminar(ev)} 
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors" 
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto mb-8">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Actividad</th>
                <th className="p-3.5">Área / Competencia</th>
                <th className="p-3.5">Niños</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((ev) => {
                const color = colorDeArea(ev.areaNombre);
                const ninosValidos = (ev.ninos || []).filter(n => (n.nombre || '').trim() !== '');

                return (
                  <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {ev.fecha ? ev.fecha.split('-').reverse().join('/') : '—'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{ev.tituloActividad || '(sin nombre)'}</td>
                    <td className="p-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${color.light} ${color.text}`}>
                        {ev.areaNombre}
                      </span>
                      <div className="text-slate-500 mt-0.5 line-clamp-1">{ev.competenciaNombre}</div>
                    </td>
                    <td className="p-3.5">
                      <div 
                        className="relative inline-block"
                        onMouseEnter={() => setHoveredAlumnosId(ev.id)}
                        onMouseLeave={() => setHoveredAlumnosId(null)}
                      >
                        <div className="w-7 h-7 rounded-full bg-[#006492] text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-[#004d70] transition-colors">
                          <Users className="w-3.5 h-3.5" />
                        </div>

                        {hoveredAlumnosId === ev.id && (
                          <div className="absolute left-0 top-full mt-1 w-60 bg-slate-900 text-white text-xs rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-1.5 border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
                            <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                              Alumnos Evaluados ({ninosValidos.length})
                            </p>
                            <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                              {ninosValidos.map((n, idx) => (
                                <div key={n.id || n.alumnoId || idx} className="text-slate-200 font-medium truncate py-0.5 px-1.5 rounded hover:bg-slate-800">
                                  • {n.nombre}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setVerEvaluacion(ev)} className="p-1.5 hover:bg-blue-50 text-[#006492] rounded-lg transition-colors" title="Ver Detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => descargarDirecto(ev)} disabled={descargandoId === ev.id} className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-50" title="Descargar Excel">
                          <Download className="w-4 h-4" />
                        </button>
                        <Link href={`/competencia/${ev.competenciaId}/evaluar?evaluacionId=${ev.id}`} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button type="button" onClick={() => setPorEliminar(ev)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {verEvaluacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setVerEvaluacion(null)}>
          <div className="bg-[#f8fafc] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex justify-between items-center border-b border-slate-200 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{verEvaluacion.tituloActividad || '(sin nombre)'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{verEvaluacion.areaNombre} - {verEvaluacion.competenciaNombre}</p>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500" onClick={() => setVerEvaluacion(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <VistaPreviaExcel
                actividad={verEvaluacion.tituloActividad}
                unidad={verEvaluacion.unidad || ''}
                fecha={verEvaluacion.fecha}
                competenciaTexto={
                  CONTENIDO_OFICIAL[verEvaluacion.competenciaId]?.competenciaTexto ||
                  verEvaluacion.competenciaNombre ||
                  ''
                }
                capacidadesTexto={
                  verEvaluacion.capacidadesTexto ||
                  CONTENIDO_OFICIAL[verEvaluacion.competenciaId]?.capacidadesTexto ||
                  ''
                }
                criterio={verEvaluacion.criterio}
                items={verEvaluacion.indicadores}
                ninos={verEvaluacion.ninos}
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
              <button className="px-5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => setVerEvaluacion(null)}>Cerrar</button>
              <button 
                onClick={() => descargarDirecto(verEvaluacion)} 
                disabled={descargandoId === verEvaluacion.id}
                className="px-5 py-2 rounded-xl bg-[#006492] text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-[#004d70] transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Exportar a Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {porEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPorEliminar(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Evaluación?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              ¿Estás seguro de eliminar <strong>&quot;{porEliminar.tituloActividad || 'esta evaluación'}&quot;</strong> realizada el <strong>{porEliminar.fecha || 'sin fecha'}</strong>? Esta acción borra el registro de forma permanente.
            </p>

            <div className="flex flex-col gap-2.5">
              <button 
                  className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={eliminandoId === porEliminar.id}
                  onClick={async () => {
                    try {
                      setEliminandoId(porEliminar.id);
                      await eliminar(porEliminar.id);
                      setPorEliminar(null);
                    } catch (error) {
                      console.error(error);
                      alert(
                        error instanceof Error
                          ? error.message
                          : 'No se pudo eliminar la evaluación.'
                      );
                    } finally {
                      setEliminandoId(null);
                    }
                  }}
                >
                  {eliminandoId === porEliminar.id ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              <button 
                className="w-full py-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 transition-all" 
                onClick={() => setPorEliminar(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DrivePage() {
  return (
    <Suspense fallback={<main className="max-w-7xl mx-auto p-6 text-slate-400 text-sm">Cargando...</main>}>
      <DriveContenido />
    </Suspense>
  );
}