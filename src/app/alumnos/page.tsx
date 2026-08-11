'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  Plus, 
  Download, 
  X, 
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  Calendar,
  CreditCard,
  Edit3,
  FileText,
  ChevronRight,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { useEvaluaciones } from '@/lib/useEvaluaciones';
import { obtenerIniciales } from '@/lib/ui';
import { useHydrated } from '@/lib/useHydrated';
import {
  construirHistorialAlumno,
  HistorialAlumnoItem,
} from '@/lib/historialAlumno';
import { DetalleEvaluacionAlumno } from '@/components/alumnos/DetalleEvaluacionAlumno';
import { ResumenAlumno } from '@/components/alumnos/ResumenAlumno';
import { generarReporteAlumno } from '@/lib/reporteAlumno';

interface Alumno {
  id: string;
  nombre: string;
  dni?: string;
}

export default function AlumnosPage() {
  const { listaAlumnos, cargado, agregarAlumno, renombrarAlumno, eliminarAlumno } = useListaAlumnos();
  const {
    evaluaciones,
    cargado: evaluacionesCargadas,
    error: errorEvaluaciones,
    recargar: recargarEvaluaciones,
  } = useEvaluaciones();
  
  const [busqueda, setBusqueda] = useState('');
  const mounted = useHydrated();
  const [vista, setVista] = useState<'grid' | 'lista'>('grid');
  const [ordenAlfabetico, setOrdenAlfabetico] = useState(true);

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [alumnoParaEliminar, setAlumnoParaEliminar] = useState<Alumno | null>(null);
  const [alumnoHistorial, setAlumnoHistorial] = useState<Alumno | null>(null);
  const [alumnoParaEditar, setAlumnoParaEditar] = useState<Alumno | null>(null);

  // Navegación interna del perfil/historial del alumno
  const [vistaHistorial, setVistaHistorial] = useState<'lista' | 'resumen' | 'detalle'>('lista');
  const [detalleHistorial, setDetalleHistorial] = useState<HistorialAlumnoItem | null>(null);
  const [generandoReporte, setGenerandoReporte] = useState(false);

  // Campos de formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDni, setEditDni] = useState('');

  // Historial individual construido desde las evaluaciones de Drive.
  // Usa la misma regla de compatibilidad por ID/nombre definida en alumnoMatch.ts.
  const historialEvaluaciones = useMemo(() => {
    if (!alumnoHistorial) return [];
    return construirHistorialAlumno(alumnoHistorial, evaluaciones);
  }, [alumnoHistorial, evaluaciones]);

  const abrirHistorial = (alumno: Alumno) => {
    setAlumnoHistorial(alumno);
    setVistaHistorial('lista');
    setDetalleHistorial(null);
  };

  const cerrarHistorial = () => {
    setAlumnoHistorial(null);
    setVistaHistorial('lista');
    setDetalleHistorial(null);
  };

  const abrirDetalleHistorial = (item: HistorialAlumnoItem) => {
    setDetalleHistorial(item);
    setVistaHistorial('detalle');
  };

  const descargarReporteAlumnoActual = async () => {
    if (!alumnoHistorial || generandoReporte) return;

    try {
      setGenerandoReporte(true);
      await generarReporteAlumno(alumnoHistorial, evaluaciones);
    } catch (error) {
      console.error('Error generando reporte del alumno:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo generar el reporte del alumno.'
      );
    } finally {
      setGenerandoReporte(false);
    }
  };

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    agregarAlumno(nuevoNombre.trim(), nuevoDni.trim() || undefined);
    setNuevoNombre('');
    setNuevoDni('');
    setModalRegistroAbierto(false);
  };

  const abrirEdicion = (alumno: Alumno) => {
    setAlumnoParaEditar(alumno);
    setEditNombre(alumno.nombre);
    setEditDni(alumno.dni || '');
  };

  const guardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoParaEditar || !editNombre.trim()) return;
    renombrarAlumno(alumnoParaEditar.id, editNombre.trim(), editDni.trim() || undefined);
    setAlumnoParaEditar(null);
  };

  const confirmarEliminar = () => {
    if (alumnoParaEliminar) {
      eliminarAlumno(alumnoParaEliminar.id);
      setAlumnoParaEliminar(null);
    }
  };

  const filtrados = useMemo(() => {
    let resultado = [...listaAlumnos];
    
    const q = busqueda.trim().toLowerCase();
    if (q) {
      resultado = resultado.filter((a) => 
        a.nombre.toLowerCase().includes(q) || (a.dni && a.dni.includes(q))
      );
    }

    resultado.sort((a, b) => {
      return ordenAlfabetico 
        ? a.nombre.localeCompare(b.nombre) 
        : b.nombre.localeCompare(a.nombre);
    });

    return resultado;
  }, [listaAlumnos, busqueda, ordenAlfabetico]);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header Bar Superior */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-600">Preschool Portal</span>
            <span>/</span>
            <span>Lima Region</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Gestión de Alumnos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Aula: Estrellitas de la Mañana (5 años)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalRegistroAbierto(true)}
          className="bg-[#006492] hover:bg-[#005278] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 w-fit"
        >
          <Plus size={18} /> Registrar Nuevo Alumno
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-sky-50 text-[#006492] rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Alumnos Registrados</p>
            <p className="text-xl font-bold text-slate-800">
              {mounted && cargado ? listaAlumnos.length : '...'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="w-full border border-slate-200 bg-slate-50/70 p-2.5 pl-9 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#006492] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setVista('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${vista === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${vista === 'lista' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ListIcon size={15} /> Lista
            </button>
          </div>

          <button
            onClick={() => setOrdenAlfabetico(!ordenAlfabetico)}
            className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={14} className="text-slate-400" />
            <span>{ordenAlfabetico ? 'A-Z' : 'Z-A'}</span>
          </button>
        </div>
      </div>

      {/* Lista / Grid */}
      {!mounted || !cargado ? (
        <div className="p-12 text-center text-xs text-slate-400">Cargando lista de alumnos...</div>
      ) : listaAlumnos.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Users size={36} className="mx-auto text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Aún no hay alumnos registrados.</p>
          <button
            onClick={() => setModalRegistroAbierto(true)}
            className="text-xs font-semibold text-[#006492] hover:underline"
          >
            Registrar el primer alumno
          </button>
        </div>
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtrados.map((a) => (
            <div 
              key={a.id} 
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm hover:shadow transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-[#006492] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    {obtenerIniciales(a.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 truncate" title={a.nombre}>
                      {a.nombre}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <CreditCard size={11} /> {a.dni ? `DNI: ${a.dni}` : 'Sin DNI'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(a)}
                    className="text-slate-300 hover:text-[#006492] p-1.5 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlumnoParaEliminar(a)}
                    className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => abrirHistorial(a)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl transition-colors text-center"
                >
                  Historial
                </button>
                <Link
                  href={`/drive?alumnoId=${a.id}`}
                  className="bg-sky-50 hover:bg-sky-100 text-[#006492] text-xs font-semibold py-2 rounded-xl transition-colors text-center"
                >
                  Reporte
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {filtrados.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-[#006492] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    {obtenerIniciales(a.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 truncate" title={a.nombre}>
                      {a.nombre}
                    </h3>
                    <p className="text-[11px] text-slate-400">DNI: {a.dni || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirHistorial(a)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Historial
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirEdicion(a)}
                    className="text-slate-400 hover:text-[#006492] p-2 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlumnoParaEliminar(a)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Registrar */}
      {modalRegistroAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setModalRegistroAbierto(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#006492] flex items-center justify-center font-bold">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Alumno</h3>
                <p className="text-xs text-slate-400">Ingresa los datos del estudiante</p>
              </div>
            </div>

            <form onSubmit={agregar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Mateo Alejandro García"
                  className="w-full border border-slate-200 bg-slate-50/50 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#006492] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">DNI (Opcional)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={nuevoDni}
                  onChange={(e) => setNuevoDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 74839201"
                  className="w-full border border-slate-200 bg-slate-50/50 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#006492] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalRegistroAbierto(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#006492] hover:bg-[#005278] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Guardar Alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edición */}
      {alumnoParaEditar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setAlumnoParaEditar(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#006492] flex items-center justify-center font-bold">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Editar Alumno</h3>
                <p className="text-xs text-slate-400">Modifica los datos guardados</p>
              </div>
            </div>

            <form onSubmit={guardarEdicion} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50/50 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#006492] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">DNI</label>
                <input
                  type="text"
                  maxLength={8}
                  value={editDni}
                  onChange={(e) => setEditDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ingrese DNI"
                  className="w-full border border-slate-200 bg-slate-50/50 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#006492] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAlumnoParaEditar(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#006492] hover:bg-[#005278] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Actualizar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar */}
      {alumnoParaEliminar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-800">¿Eliminar alumno?</h3>
              <p className="text-xs text-slate-500">
                Estás a punto de eliminar a <span className="font-semibold text-slate-700">{alumnoParaEliminar.nombre}</span>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAlumnoParaEliminar(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Panel de perfil e historial individual */}
      {alumnoHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-0 backdrop-blur-sm md:p-4">
          <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border border-slate-100 bg-white shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-3xl">
            {/* Encabezado fijo */}
            <div className="shrink-0 border-b border-slate-100 bg-white p-5 md:p-6">
              <button
                type="button"
                onClick={cerrarHistorial}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar historial"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#006492] text-sm font-bold text-white shadow-md">
                  {obtenerIniciales(alumnoHistorial.nombre)}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-900">
                    {alumnoHistorial.nombre}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {alumnoHistorial.dni
                      ? `DNI: ${alumnoHistorial.dni}`
                      : 'DNI: No especificado'}
                  </p>
                </div>
              </div>

              {evaluacionesCargadas && !errorEvaluaciones && historialEvaluaciones.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVistaHistorial('lista');
                      setDetalleHistorial(null);
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                      vistaHistorial === 'lista'
                        ? 'bg-[#006492] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Historial
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVistaHistorial('resumen');
                      setDetalleHistorial(null);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                      vistaHistorial === 'resumen'
                        ? 'bg-[#006492] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Eye size={14} />
                    Vista general
                  </button>

                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    {historialEvaluaciones.length} registro(s)
                  </span>
                </div>
              )}
            </div>

            {/* Contenido desplazable */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6">
              {!evaluacionesCargadas ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    Cargando evaluaciones de Drive...
                  </p>
                </div>
              ) : errorEvaluaciones ? (
                <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
                  <p className="text-sm font-semibold text-rose-800">
                    No se pudo cargar el historial desde Drive.
                  </p>
                  <p className="text-xs text-rose-700">{errorEvaluaciones}</p>
                  <button
                    type="button"
                    onClick={() => void recargarEvaluaciones()}
                    className="min-h-10 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    Reintentar
                  </button>
                </div>
              ) : historialEvaluaciones.length === 0 ? (
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-8 text-center">
                  <Calendar size={32} className="mx-auto text-slate-300" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      Sin evaluaciones registradas
                    </p>
                    <p className="text-xs text-slate-400">
                      Este alumno aún no cuenta con registros dentro de las fichas guardadas.
                    </p>
                  </div>
                </div>
              ) : vistaHistorial === 'detalle' && detalleHistorial ? (
                <DetalleEvaluacionAlumno
                  item={detalleHistorial}
                  onVolver={() => {
                    setVistaHistorial('lista');
                    setDetalleHistorial(null);
                  }}
                />
              ) : vistaHistorial === 'resumen' ? (
                <ResumenAlumno
                  alumno={alumnoHistorial}
                  historial={historialEvaluaciones}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <FileText size={14} className="text-[#006492]" />
                      Fichas y evaluaciones
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      Toca un registro para ver únicamente los resultados de este alumno.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {historialEvaluaciones.map((item) => (
                      <button
                        key={item.evaluacionId}
                        type="button"
                        onClick={() => abrirDetalleHistorial(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-left transition-all hover:border-sky-200 hover:bg-sky-50/40"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="max-w-full truncate text-xs font-bold text-slate-800">
                              {item.competenciaNombre}
                            </span>

                            {item.nivelAlcanzado && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  item.nivelAlcanzado === 'L'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : item.nivelAlcanzado === 'EP'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                Nivel {item.nivelAlcanzado}
                              </span>
                            )}
                          </div>

                          <p className="truncate text-[11px] font-medium text-slate-600">
                            {item.actividad || 'Actividad sin nombre'}
                          </p>

                          <p className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar size={11} />
                            {item.fecha
                              ? item.fecha.split('-').reverse().join('/')
                              : 'Fecha no registrada'}
                          </p>

                          {item.observacionDescriptiva && (
                            <p className="max-w-md truncate text-[11px] italic text-slate-500">
                              &quot;{item.observacionDescriptiva}&quot;
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 rounded-xl bg-white p-2 text-slate-400 shadow-sm">
                          <ChevronRight size={16} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones fijas */}
            {evaluacionesCargadas && !errorEvaluaciones && historialEvaluaciones.length > 0 && (
              <div className="grid shrink-0 grid-cols-1 gap-2 border-t border-slate-100 bg-white p-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void descargarReporteAlumnoActual()}
                  disabled={generandoReporte}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-[#006492] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  {generandoReporte ? 'Generando Excel...' : 'Descargar reporte Excel'}
                </button>

                <Link
                  href={`/drive?alumnoId=${alumnoHistorial.id}`}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#006492] px-4 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#005278]"
                >
                  <Download size={16} />
                  Ver registros en Drive
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}