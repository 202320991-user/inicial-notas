'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { listarEvaluaciones } from '@/lib/evaluaciones';
import { obtenerIniciales } from '@/lib/ui';

interface Alumno {
  id: string;
  nombre: string;
  dni?: string;
}

export default function AlumnosPage() {
  const { listaAlumnos, cargado, agregarAlumno, renombrarAlumno, eliminarAlumno } = useListaAlumnos();
  
  const [busqueda, setBusqueda] = useState('');
  const [mounted, setMounted] = useState(false);
  const [vista, setVista] = useState<'grid' | 'lista'>('grid');
  const [ordenAlfabetico, setOrdenAlfabetico] = useState(true);

  // Modales
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [alumnoParaEliminar, setAlumnoParaEliminar] = useState<Alumno | null>(null);
  const [alumnoHistorial, setAlumnoHistorial] = useState<Alumno | null>(null);
  const [alumnoParaEditar, setAlumnoParaEditar] = useState<Alumno | null>(null);

  // Historial de evaluaciones del alumno seleccionado
  const [historialEvaluaciones, setHistorialEvaluaciones] = useState<any[]>([]);

  // Campos de formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDni, setEditDni] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Búsqueda profunda dentro del arreglo de niños ('ninos') de cada ficha guardada
  useEffect(() => {
    if (!alumnoHistorial) {
      setHistorialEvaluaciones([]);
      return;
    }

    try {
      const todasEvaluaciones = listarEvaluaciones();
      const historicoAlumno: any[] = [];

      todasEvaluaciones.forEach((evaluacion: any) => {
        // La ficha guardada contiene el arreglo de niños en .ninos (o .alumnos)
        const listaNinos = evaluacion.ninos || evaluacion.alumnos || evaluacion.estudiantes || [];

        // Buscamos si el alumno seleccionado forma parte de esta ficha
        const registroNino = listaNinos.find((n: any) => {
          if (!n) return false;

          // 1. Coincidencia por ID (si se guardó con ID)
          if (n.id && alumnoHistorial.id && n.id === alumnoHistorial.id) return true;
          if (n.alumnoId && alumnoHistorial.id && n.alumnoId === alumnoHistorial.id) return true;

          // 2. Coincidencia por Nombre (normalizado a minúsculas y sin espacios de más)
          const nombreNino = (n.nombre || n.nombreAlumno || '').trim().toLowerCase();
          const nombreBuscado = alumnoHistorial.nombre.trim().toLowerCase();

          return (
            nombreNino !== '' &&
            (nombreNino === nombreBuscado ||
              nombreNino.includes(nombreBuscado) ||
              nombreBuscado.includes(nombreNino))
          );
        });

        // Si el alumno está dentro de la ficha, extraemos su información específica
        if (registroNino) {
          historicoAlumno.push({
            id: evaluacion.id,
            fecha: evaluacion.fecha || evaluacion.creadoEn,
            competenciaNombre:
              evaluacion.competenciaNombre ||
              evaluacion.competenciaTexto ||
              evaluacion.titulo ||
              'Ficha de Evaluación',
            nivelLogro: registroNino.nivelLogro || registroNino.nivel || (Array.isArray(registroNino.calificaciones) ? registroNino.calificaciones.find(Boolean) : null),
            observacion:
              registroNino.observacionDescriptiva ||
              registroNino.observacion ||
              registroNino.conclusiones,
            datosNino: registroNino
          });
        }
      });

      setHistorialEvaluaciones(historicoAlumno);
    } catch (error) {
      console.error('Error al cargar historial del alumno:', error);
      setHistorialEvaluaciones([]);
    }
  }, [alumnoHistorial]);

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
                  onClick={() => setAlumnoHistorial(a)}
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
                    onClick={() => setAlumnoHistorial(a)}
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

      {/* Modal / Panel de Historial Conectado */}
      {alumnoHistorial && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-3xl max-w-lg w-full h-full md:h-auto max-h-[90vh] p-6 shadow-2xl border border-slate-100 space-y-5 overflow-y-auto relative flex flex-col">
            <button
              onClick={() => setAlumnoHistorial(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#006492] text-white font-bold flex items-center justify-center text-sm shadow-md">
                {obtenerIniciales(alumnoHistorial.nombre)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{alumnoHistorial.nombre}</h3>
                <p className="text-xs text-slate-400">
                  {alumnoHistorial.dni ? `DNI: ${alumnoHistorial.dni}` : 'DNI: No especificado'}
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-[#006492]" /> Fichas y Evaluaciones
                </h4>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {historialEvaluaciones.length} registro(s)
                </span>
              </div>

              {historialEvaluaciones.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-3">
                  <Calendar size={32} className="mx-auto text-slate-300" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Sin evaluaciones registradas</p>
                    <p className="text-xs text-slate-400">
                      Este alumno aún no cuenta con registros dentro de las fichas guardadas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {historialEvaluaciones.map((item: any, idx: number) => (
                    <div 
                      key={item.id || idx}
                      className="bg-slate-50 border border-slate-200/70 hover:border-sky-200 rounded-2xl p-3.5 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {item.competenciaNombre}
                          </span>
                          {item.nivelLogro && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.nivelLogro === 'AD' ? 'bg-emerald-100 text-emerald-700' :
                              item.nivelLogro === 'A' ? 'bg-sky-100 text-[#006492]' :
                              item.nivelLogro === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              Nivel {item.nivelLogro}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> {item.fecha ? new Date(item.fecha).toLocaleDateString() : 'Fecha no registrada'}
                        </p>
                        {item.observacion && (
                          <p className="text-[11px] text-slate-500 italic truncate max-w-xs">
                            "{item.observacion}"
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/drive?alumnoId=${alumnoHistorial.id}`}
                        className="p-2 text-slate-400 hover:text-[#006492] hover:bg-white rounded-xl transition-colors shadow-sm shrink-0"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href={`/drive?alumnoId=${alumnoHistorial.id}`}
                className="w-full bg-[#006492] hover:bg-[#005278] text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Download size={16} /> Ver Reportes en Drive
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}