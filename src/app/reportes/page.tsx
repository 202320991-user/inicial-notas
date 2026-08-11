'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { useEvaluaciones } from '@/lib/useEvaluaciones';
import { COMPETENCIAS } from '@/lib/competencias';
import { obtenerIniciales } from '@/lib/ui';
import { useHydrated } from '@/lib/useHydrated';
import { buscarRegistroAlumno } from '@/lib/alumnoMatch';
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Search,
  UserCheck,
  CalendarDays,
} from 'lucide-react';

const REGISTROS_NECESARIOS_POR_COMPETENCIA_BIMESTRE = 3;
const REGISTROS_NECESARIOS_POR_COMPETENCIA_MES = 2;

type PeriodoFiltro = 'mes' | 'bimestre';
type BimestreId = 'b1' | 'b2' | 'b3' | 'b4';

const BIMESTRES: {
  id: BimestreId;
  nombre: string;
  inicio: [number, number];
  fin: [number, number];
}[] = [
  { id: 'b1', nombre: 'I Bimestre', inicio: [3, 1], fin: [5, 15] },
  { id: 'b2', nombre: 'II Bimestre', inicio: [5, 16], fin: [7, 31] },
  { id: 'b3', nombre: 'III Bimestre', inicio: [8, 1], fin: [10, 15] },
  { id: 'b4', nombre: 'IV Bimestre', inicio: [10, 16], fin: [12, 31] },
];

function pad(numero: number): string {
  return String(numero).padStart(2, '0');
}

function fechaISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${pad(mes)}-${pad(dia)}`;
}

function mesActualISO(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}`;
}

function bimestreActual(): BimestreId {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const dia = hoy.getDate();

  if (mes < 5 || (mes === 5 && dia <= 15)) return 'b1';
  if (mes < 8) return 'b2';
  if (mes < 10 || (mes === 10 && dia <= 15)) return 'b3';
  return 'b4';
}

function obtenerRangoBimestre(anio: number, bimestre: BimestreId) {
  const config =
    BIMESTRES.find((item) => item.id === bimestre) ?? BIMESTRES[0];

  return {
    desde: fechaISO(anio, config.inicio[0], config.inicio[1]),
    hasta: fechaISO(anio, config.fin[0], config.fin[1]),
    etiqueta: `${config.nombre} ${anio}`,
  };
}

export default function ReportesPage() {
  const { listaAlumnos } = useListaAlumnos();
  const { evaluaciones } = useEvaluaciones();

  const montado = useHydrated();
  const [busqueda, setBusqueda] = useState('');
  const [periodoFiltro, setPeriodoFiltro] =
    useState<PeriodoFiltro>('bimestre');
  const [mesSeleccionado, setMesSeleccionado] =
    useState(mesActualISO());
  const [bimestreSeleccionado, setBimestreSeleccionado] =
    useState<BimestreId>(bimestreActual());
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear()
  );

  const alumnosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    if (!query) return listaAlumnos;

    return listaAlumnos.filter(
      (alumno) =>
        alumno.nombre.toLowerCase().includes(query) ||
        (alumno.dni && alumno.dni.toLowerCase().includes(query))
    );
  }, [listaAlumnos, busqueda]);

  const totalAlumnos = listaAlumnos.length;

  /**
   * Periodo temporal REAL.
   *
   * Si el input de mes se vacía temporalmente, usamos el mes actual
   * como respaldo para evitar fechas inválidas y RangeError.
   */
  const periodoActivo = useMemo(() => {
    if (periodoFiltro === 'mes') {
      const valorMes =
        /^\d{4}-\d{2}$/.test(mesSeleccionado)
          ? mesSeleccionado
          : mesActualISO();

      const [anioTexto, mesTexto] = valorMes.split('-');
      const anio = Number(anioTexto);
      const mes = Number(mesTexto);

      const ultimoDia = new Date(anio, mes, 0).getDate();
      const fechaReferencia = new Date(anio, mes - 1, 1);

      return {
        desde: fechaISO(anio, mes, 1),
        hasta: fechaISO(anio, mes, ultimoDia),
        etiqueta: new Intl.DateTimeFormat('es-PE', {
          month: 'long',
          year: 'numeric',
        }).format(fechaReferencia),
        registrosMetaPorCompetencia:
          REGISTROS_NECESARIOS_POR_COMPETENCIA_MES,
      };
    }

    const rango = obtenerRangoBimestre(
      anioSeleccionado,
      bimestreSeleccionado
    );

    return {
      ...rango,
      registrosMetaPorCompetencia:
        REGISTROS_NECESARIOS_POR_COMPETENCIA_BIMESTRE,
    };
  }, [
    periodoFiltro,
    mesSeleccionado,
    anioSeleccionado,
    bimestreSeleccionado,
  ]);

  const evaluacionesDelPeriodo = useMemo(() => {
    return evaluaciones.filter((evaluacion) => {
      if (!evaluacion.fecha) return false;

      return (
        evaluacion.fecha >= periodoActivo.desde &&
        evaluacion.fecha <= periodoActivo.hasta
      );
    });
  }, [evaluaciones, periodoActivo]);

  const obtenerProgresoAlumno = (
    alumnoId: string,
    nombreAlumno: string
  ) => {
    const alumno = listaAlumnos.find(
      (item) => item.id === alumnoId
    ) ?? {
      id: alumnoId,
      nombre: nombreAlumno,
    };

    const areasUnicas = Array.from(
      new Set(COMPETENCIAS.map((competencia) => competencia.area))
    );

    const resultado: Record<string, number> = {};

    let totalRegistrosAlumno = 0;
    let totalMaximoAlumno = 0;

    areasUnicas.forEach((area) => {
      const compsArea = COMPETENCIAS.filter(
        (competencia) => competencia.area === area
      );

      const compIdsArea = compsArea.map(
        (competencia) => competencia.id
      );

      const maxRegistrosArea =
        compsArea.length *
        periodoActivo.registrosMetaPorCompetencia;

      totalMaximoAlumno += maxRegistrosArea;

      let registrosValidosArea = 0;

      evaluacionesDelPeriodo.forEach((evaluacion) => {
        if (!compIdsArea.includes(evaluacion.competenciaId)) {
          return;
        }

        const participacion = buscarRegistroAlumno(
          evaluacion,
          alumno
        );

        if (
          participacion &&
          (
            participacion.nivelAlcanzado ||
            (
              Array.isArray(participacion.calificaciones) &&
              participacion.calificaciones.some(Boolean)
            )
          )
        ) {
          registrosValidosArea++;
        }
      });

      totalRegistrosAlumno += registrosValidosArea;

      const porcentajeArea =
        maxRegistrosArea > 0
          ? (registrosValidosArea / maxRegistrosArea) * 100
          : 0;

      resultado[area] = Math.min(
        100,
        Math.round(porcentajeArea)
      );
    });

    const porcentajeTotal =
      totalMaximoAlumno > 0
        ? Math.min(
            100,
            Math.round(
              (totalRegistrosAlumno / totalMaximoAlumno) * 100
            )
          )
        : 0;

    return {
      porAreas: resultado,
      porcentajeTotal,
      registrosRealizados: totalRegistrosAlumno,
      registrosEsperados: totalMaximoAlumno,
      completado:
        totalMaximoAlumno > 0 &&
        totalRegistrosAlumno >= totalMaximoAlumno,
    };
  };

  const alumnosEvaluadosIds = useMemo(() => {
    const evaluadosSet = new Set<string>();

    listaAlumnos.forEach((alumno) => {
      const progreso = obtenerProgresoAlumno(
        alumno.id,
        alumno.nombre
      );

      if (progreso.completado) {
        evaluadosSet.add(alumno.id);
      }
    });

    return evaluadosSet;
  }, [
    evaluacionesDelPeriodo,
    listaAlumnos,
    periodoActivo,
  ]);

  const evaluadosTotal = alumnosEvaluadosIds.size;

  const evaluacionesPendientes = Math.max(
    0,
    totalAlumnos - evaluadosTotal
  );

  const avanceGeneral =
    totalAlumnos > 0
      ? Math.round(
          listaAlumnos.reduce(
            (acumulado, alumno) =>
              acumulado +
              obtenerProgresoAlumno(
                alumno.id,
                alumno.nombre
              ).porcentajeTotal,
            0
          ) / totalAlumnos
        )
      : 0;

  if (!montado) {
    return (
      <main className="min-h-screen max-w-7xl mx-auto bg-slate-50 p-4 text-sm text-slate-400 md:p-8">
        Cargando reportes...
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-7xl mx-auto space-y-6 bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
      {/* CABECERA */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
            Reportes de Progreso Académico
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Control de cobertura de registros según el periodo seleccionado.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200/60 bg-slate-100 p-1 sm:self-auto">
            <CalendarDays className="ml-2 mr-1 hidden h-4 w-4 text-slate-400 sm:block" />

            <button
              type="button"
              onClick={() => setPeriodoFiltro('mes')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                periodoFiltro === 'mes'
                  ? 'bg-white text-[#006492] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes
            </button>

            <button
              type="button"
              onClick={() => setPeriodoFiltro('bimestre')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                periodoFiltro === 'bimestre'
                  ? 'bg-white text-[#006492] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bimestre
            </button>
          </div>

          {periodoFiltro === 'mes' ? (
            <input
              type="month"
              value={mesSeleccionado}
              onChange={(event) => {
                const valor = event.target.value;
                setMesSeleccionado(valor || mesActualISO());
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#006492]"
            />
          ) : (
            <div className="flex gap-2">
              <select
                value={bimestreSeleccionado}
                onChange={(event) =>
                  setBimestreSeleccionado(
                    event.target.value as BimestreId
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#006492]"
              >
                {BIMESTRES.map((bimestre) => (
                  <option
                    key={bimestre.id}
                    value={bimestre.id}
                  >
                    {bimestre.nombre}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={2020}
                max={2100}
                value={anioSeleccionado}
                onChange={(event) => {
                  const valor = Number(event.target.value);

                  setAnioSeleccionado(
                    Number.isFinite(valor) && valor >= 2020
                      ? valor
                      : new Date().getFullYear()
                  );
                }}
                className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#006492]"
              />
            </div>
          )}
        </div>
      </div>

      {/* PERIODO ACTIVO */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
        <p className="text-xs font-semibold text-[#006492]">
          Periodo activo: {periodoActivo.etiqueta}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-500">
          Se están considerando únicamente las evaluaciones entre{' '}
          {periodoActivo.desde.split('-').reverse().join('/')} y{' '}
          {periodoActivo.hasta.split('-').reverse().join('/')}.
        </p>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Alumnos
            </span>

            <p className="text-2xl font-extrabold text-slate-900">
              {totalAlumnos}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#006492]">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Meta de cobertura cumplida
            </span>

            <p className="text-2xl font-extrabold text-slate-900">
              {evaluadosTotal}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cobertura incompleta
            </span>

            <p className="text-2xl font-extrabold text-slate-900">
              {evaluacionesPendientes}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cobertura promedio
            </span>

            <p className="text-xs font-extrabold text-[#006492]">
              Meta: {periodoActivo.registrosMetaPorCompetencia} registro(s) por competencia
            </p>
          </div>

          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />

            <span className="text-xs font-bold text-slate-900">
              {avanceGeneral}%
            </span>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-stretch justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center md:p-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Listado de Estudiantes
            </h2>

            <p className="text-[11px] text-slate-400">
              Cobertura calculada solo con registros de{' '}
              <span className="font-semibold text-slate-600">
                {periodoActivo.etiqueta}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#006492]"
              />
            </div>

            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Alumno</th>
                <th className="p-4">DNI</th>
                <th className="p-4">Cobertura por áreas</th>
                <th className="p-4">Estado del periodo</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {alumnosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-400"
                  >
                    No se encontraron estudiantes registrados.
                  </td>
                </tr>
              ) : (
                alumnosFiltrados.map((alumno) => {
                  const datosProgreso =
                    obtenerProgresoAlumno(
                      alumno.id,
                      alumno.nombre
                    );

                  const estaCompleto =
                    datosProgreso.completado;

                  return (
                    <tr
                      key={alumno.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006492] text-xs font-bold text-white">
                            {obtenerIniciales(
                              alumno.nombre
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {alumno.nombre}
                            </p>

                            <p className="text-[11px] text-slate-400">
                              {datosProgreso.registrosRealizados} de{' '}
                              {datosProgreso.registrosEsperados}{' '}
                              registros de cobertura
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-medium text-slate-600">
                        {alumno.dni || '—'}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                          {Object.entries(
                            datosProgreso.porAreas
                          ).map(
                            ([nombreArea, porcentaje]) => {
                              const sigla = nombreArea
                                .substring(0, 4)
                                .toUpperCase();

                              return (
                                <div
                                  key={nombreArea}
                                  className="min-w-[90px]"
                                >
                                  <span className="mb-1 block text-[10px] font-bold text-slate-600">
                                    {sigla} ({porcentaje}%)
                                  </span>

                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-[#006492] transition-all"
                                      style={{
                                        width: `${porcentaje}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {estaCompleto ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Cobertura cumplida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            En proceso
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/drive?alumnoId=${alumno.id}`}
                          className="text-xs font-bold text-[#006492] hover:underline"
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