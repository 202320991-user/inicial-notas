'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { generarExcelBase64, generarExcelEvaluacion } from '@/lib/excel';
import { getCompetencia, MAX_NINOS } from '@/lib/competencias';
import { crearId } from '@/lib/roster';
import { leerJSON, guardarJSON } from '@/lib/storage';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { CONTENIDO_OFICIAL } from '@/lib/contenidoOficial';
import { UNIDADES_PREDEFINIDAS } from '@/lib/unidadesPredefinidas';
import {
  EvaluacionGuardada,
  MoldeGuardado,
  Nivel,
  NinoGuardado,
  RegistroAlumno,
} from '@/types';

function crearNino(nombre: string = '', alumnoId: string | null = null): NinoGuardado {
  return {
    id: crearId('nino'),
    alumnoId,
    nombre,
    calificaciones: [],
    nivelAlcanzado: '',
    nivelManual: false,
    observacionDescriptiva: '',
  };
}

function ninosPorDefecto(cantidad: number = 4): NinoGuardado[] {
  return Array.from({ length: cantidad }, () => crearNino(''));
}

// Estructura del borrador temporal de una evaluación EXISTENTE que se está editando.
// Se guarda ligado al evaluacionId (no a la competencia) para que los cambios
// sobrevivan al navegar entre "Editar Plantilla / Evaluar / Vista Previa" sin
// perderse ni mezclarse con los de otra evaluación.
type BorradorEvaluacion = {
  creadoEn?: string;
  actividad: string;
  unidad: string;
  fecha: string;
  criterio: string;
  items: string[];
  capacidadesTexto: string;
  ninos: NinoGuardado[];
};

type ResultadoGuardadoDrive = EvaluacionGuardada & {
  drive: {
    ok?: boolean;
    error?: string;
    evaluacionId?: string;
    json?: { id: string; nombre: string } | null;
    excel?: { id: string; nombre: string } | null;
  };
};

function claveBorrador(evaluacionId: string): string {
  return `borrador_evaluacion_${evaluacionId}`;
}

export function calcularNivelSugerido(calificaciones: Nivel[]): Nivel {
  const conteo: Record<string, number> = { L: 0, EP: 0, I: 0 };
  calificaciones.forEach((c) => {
    if (c) conteo[c]++;
  });
  const total = conteo.L + conteo.EP + conteo.I;
  if (total === 0) return '';
  let mejor: Nivel = 'L';
  let max = -1;
  (['L', 'EP', 'I'] as Nivel[]).forEach((n) => {
    if (conteo[n] > max) {
      max = conteo[n];
      mejor = n;
    }
  });
  return mejor;
}

export function useFicha(competenciaId: string, evaluacionIdAEditar?: string) {
  const competenciaInfo = getCompetencia(competenciaId);
  const { listaAlumnos } = useListaAlumnos();
  const [evaluacionIdActual, setEvaluacionIdActual] = useState<string | undefined>(evaluacionIdAEditar);
  const [creadoEnEvaluacion, setCreadoEnEvaluacion] = useState<string | undefined>();

  const [actividad, setActividad] = useState('');
  const [unidad, setUnidad] = useState('');
  const [fecha, setFecha] = useState('');
  const [criterio, setCriterio] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [competenciaTexto, setCompetenciaTexto] = useState('');
  const [capacidadesTexto, setCapacidadesTexto] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardadoMoldeEn, setGuardadoMoldeEn] = useState<number | null>(null);
  const [guardadoNinosEn, setGuardadoNinosEn] = useState<number | null>(null);
  const [filasPlantilla, setFilasPlantilla] = useState(0);

  const listoParaGuardar = useRef(false);
  const guardadoEnCurso = useRef<Promise<ResultadoGuardadoDrive> | null>(null);
  const [ninos, setNinos] = useState<NinoGuardado[]>([]);

  const indicadoresActivos = useMemo(
    () => items.map((texto, idx) => ({ texto, idx })).filter((i) => i.texto.trim() !== ''),
    [items]
  );

  const alumnosDisponibles = useMemo(
    () => listaAlumnos.filter((a) => !ninos.some((n) => n.alumnoId === a.id)),
    [listaAlumnos, ninos]
  );

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      listoParaGuardar.current = false;
      setCargando(true);
      setError('');

      if (!competenciaInfo) {
        setError('Competencia no encontrada.');
        setCargando(false);
        return;
      }

      const oficial = CONTENIDO_OFICIAL[competenciaId];

      if (!oficial) {
        setError(`No se encontraron datos oficiales para la competencia ${competenciaId}.`);
        setCargando(false);
        return;
      }

      setCompetenciaTexto(oficial.competenciaTexto);

      const capacidadesPorDefecto = oficial.capacidadesTexto;
      const criterioPorDefecto = oficial.criterioTexto;
      const indicadoresDefault = oficial.indicadores || [];

      setFilasPlantilla(indicadoresDefault.length);

      /**
       * --------------------------------------------------
       * EDITANDO UNA EVALUACIÓN EXISTENTE
       * --------------------------------------------------
       */
      if (evaluacionIdAEditar) {
        try {
          /**
           * Primero buscamos un borrador local de esta misma evaluación.
           * Si existe, tiene prioridad para no perder cambios sin guardar.
           */
          const borrador = leerJSON<BorradorEvaluacion | null>(
            claveBorrador(evaluacionIdAEditar),
            null
          );

          if (borrador) {
            let creadoEn = borrador.creadoEn;

            // Los borradores creados antes de esta migraciÃ³n no tienen timestamp.
            // Lo recuperamos de Drive sin reemplazar el contenido local del borrador.
            if (!creadoEn) {
              try {
                const respuesta = await fetch(
                  `/api/drive/obtener?id=${encodeURIComponent(evaluacionIdAEditar)}`,
                  { method: 'GET', cache: 'no-store' }
                );
                const datos = await respuesta.json();
                if (respuesta.ok && datos.ok && typeof datos.evaluacion?.creadoEn === 'string') {
                  creadoEn = datos.evaluacion.creadoEn;
                }
              } catch {
                // El borrador sigue disponible aun si la red no permite recuperar el timestamp.
              }
            }

            if (cancelado) return;

            setActividad(borrador.actividad);
            setUnidad(borrador.unidad);
            setFecha(borrador.fecha);
            setCriterio(borrador.criterio);
            setCapacidadesTexto(borrador.capacidadesTexto);
            setItems(borrador.items?.length ? borrador.items : indicadoresDefault);
            setNinos(borrador.ninos?.length ? borrador.ninos : ninosPorDefecto());
            setEvaluacionIdActual(evaluacionIdAEditar);
            setCreadoEnEvaluacion(creadoEn);

            setCargando(false);

            setTimeout(() => {
              listoParaGuardar.current = true;
            }, 0);

            return;
          }

          /**
           * Si no hay borrador, cargamos la evaluación real
           * directamente desde Google Drive.
           */
          const response = await fetch(
            `/api/drive/obtener?id=${encodeURIComponent(evaluacionIdAEditar)}`,
            {
              method: 'GET',
              cache: 'no-store',
            }
          );

          const data = await response.json();

          if (!response.ok || !data.ok || !data.evaluacion) {
            throw new Error(
              data.error || 'No se pudo cargar la evaluación desde Google Drive.'
            );
          }

          if (cancelado) return;

          const evaluacionExistente = data.evaluacion;

          setActividad(evaluacionExistente.tituloActividad || '');
          setUnidad(evaluacionExistente.unidad || '');
          setFecha(evaluacionExistente.fecha || '');
          setCriterio(evaluacionExistente.criterio || criterioPorDefecto);
          setCapacidadesTexto(
            evaluacionExistente.capacidadesTexto || capacidadesPorDefecto
          );
          setItems(
            evaluacionExistente.indicadores?.length > 0
              ? evaluacionExistente.indicadores
              : indicadoresDefault
          );
          setNinos(
            evaluacionExistente.ninos?.length > 0
              ? evaluacionExistente.ninos
              : ninosPorDefecto()
          );

          setEvaluacionIdActual(evaluacionExistente.id);
          setCreadoEnEvaluacion(evaluacionExistente.creadoEn);
        } catch (e) {
          console.error('Error cargando evaluación desde Google Drive:', e);

          if (!cancelado) {
            setError(
              e instanceof Error
                ? e.message
                : 'No se pudo cargar la evaluación.'
            );
          }
        }
      } else {
        /**
         * --------------------------------------------------
         * NUEVA EVALUACIÓN
         * --------------------------------------------------
         */
        const guardado = leerJSON<MoldeGuardado | null>(
          `molde_${competenciaId}`,
          null
        );

        const tieneItemsGuardados = !!guardado?.items?.length;

        if (tieneItemsGuardados && guardado) {
          setActividad(guardado.actividad || '');
          setUnidad(guardado.unidad || '');
          setFecha(guardado.fecha || '');
          setCriterio(guardado.criterio || criterioPorDefecto);
          setItems(guardado.items);
          setCapacidadesTexto(
            guardado.capacidadesTexto || capacidadesPorDefecto
          );
        } else {
          setActividad('');
          setUnidad('');
          setFecha('');
          setCriterio(criterioPorDefecto);
          setItems(indicadoresDefault);
          setCapacidadesTexto(capacidadesPorDefecto);
        }

        const sesionGuardada = leerJSON<NinoGuardado[] | null>(
          `sesion_${competenciaId}`,
          null
        );

        if (sesionGuardada && sesionGuardada.length > 0) {
          setNinos(sesionGuardada);
        } else {
          setNinos(ninosPorDefecto());
        }

        setEvaluacionIdActual(undefined);
        setCreadoEnEvaluacion(undefined);
      }

      if (!cancelado) {
        setCargando(false);

        setTimeout(() => {
          listoParaGuardar.current = true;
        }, 0);
      }
    };

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [competenciaId, evaluacionIdAEditar, competenciaInfo]);

  // Autoguardado de los datos de la ficha (actividad, unidad, fecha, criterio, items, capacidades).
  // Si se está editando una evaluación existente, se guarda como borrador ligado a su evaluacionId
  // (incluyendo a los niños) para que sobreviva a la navegación entre páginas.
  // Si es una ficha nueva, se mantiene el comportamiento original (molde_${competenciaId}).
  useEffect(() => {
    if (!listoParaGuardar.current) return;
    const timer = setTimeout(() => {
      if (evaluacionIdActual) {
        const borrador: BorradorEvaluacion = {
          creadoEn: creadoEnEvaluacion,
          actividad,
          unidad,
          fecha,
          criterio,
          items,
          capacidadesTexto,
          ninos,
        };
        guardarJSON(claveBorrador(evaluacionIdActual), borrador);
      } else {
        const molde: MoldeGuardado = { competenciaId, actividad, unidad, fecha, criterio, items, capacidadesTexto };
        guardarJSON(`molde_${competenciaId}`, molde);
      }
      setGuardadoMoldeEn(Date.now());
    }, 600);
    return () => clearTimeout(timer);
  }, [competenciaId, evaluacionIdActual, creadoEnEvaluacion, actividad, unidad, fecha, criterio, items, capacidadesTexto, ninos]);

  // Autoguardado de los niños de la sesión, SOLO para fichas nuevas
  // (cuando se edita una evaluación existente, los niños ya quedan incluidos
  // en el borrador guardado arriba, para no duplicar ni desincronizar datos).
  useEffect(() => {
    if (!listoParaGuardar.current) return;
    const timer = setTimeout(() => {
      if (!evaluacionIdActual) {
        guardarJSON(`sesion_${competenciaId}`, ninos);
      }
      setGuardadoNinosEn(Date.now());
    }, 600);
    return () => clearTimeout(timer);
  }, [competenciaId, evaluacionIdActual, ninos]);

  const unidadPredefinida = UNIDADES_PREDEFINIDAS[competenciaId];

  const cargarUnidadPredefinida = (): { aplicados: number; total: number } | null => {
    if (!unidadPredefinida) return null;
    const total = unidadPredefinida.indicadores.length;
    const aplicados = Math.min(items.length, total);
    setCriterio(unidadPredefinida.criterio);
    setItems((prev) => prev.map((texto, i) => unidadPredefinida.indicadores[i] ?? texto));
    return { aplicados, total };
  };

  const restaurarPlantillaOriginal = () => {
    if (!competenciaInfo) return;
    const oficial = CONTENIDO_OFICIAL[competenciaId];
    if (!oficial) return;
    setCriterio(oficial.criterioTexto);
    setCapacidadesTexto(oficial.capacidadesTexto);
    setItems(oficial.indicadores);
  };

  const handleItemChange = (texto: string, index: number) => {
    setItems((prev) => {
      const nuevos = [...prev];
      nuevos[index] = texto;
      return nuevos;
    });
  };

  const eliminarIndicador = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarIndicador = () => {
    setItems((prev) => [...prev, '']);
    return items.length + 1 > filasPlantilla;
  };

  const agregarNino = () => {
    if (ninos.length >= MAX_NINOS) return false;
    setNinos((prev) => [...prev, crearNino('')]);
    return true;
  };

  const agregarNinoDesdeLista = (alumnoId: string) => {
    if (!alumnoId) return false;
    const alumno = listaAlumnos.find((a) => a.id === alumnoId);
    if (!alumno) return false;

    setNinos((prev) => {
      const primerVacioIdx = prev.findIndex((n) => n.nombre.trim() === '');

      if (primerVacioIdx !== -1) {
        const copia = [...prev];
        copia[primerVacioIdx] = crearNino(alumno.nombre, alumno.id);
        return copia;
      }

      if (prev.length >= MAX_NINOS) return prev;
      return [...prev, crearNino(alumno.nombre, alumno.id)];
    });

    return true;
  };

  const eliminarNino = (idx: number) => {
    setNinos((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const actualizarNino = (idx: number, cambios: Partial<NinoGuardado>) => {
    setNinos((prev) => prev.map((n, i) => (i === idx ? { ...n, ...cambios } : n)));
  };

  const handleNombreChange = (idx: number, valor: string) => actualizarNino(idx, { nombre: valor });

  const handleCalificacion = (ninoIdx: number, indicadorIdx: number, nivel: Nivel) => {
    setNinos((prev) =>
      prev.map((n, i) => {
        if (i !== ninoIdx) return n;
        const calif = [...n.calificaciones];
        calif[indicadorIdx] = calif[indicadorIdx] === nivel ? '' : nivel;
        const nuevoNivel = n.nivelManual ? n.nivelAlcanzado : calcularNivelSugerido(calif);
        return { ...n, calificaciones: calif, nivelAlcanzado: nuevoNivel };
      })
    );
  };

  const handleNivelManual = (idx: number, nivel: Nivel) => actualizarNino(idx, { nivelAlcanzado: nivel, nivelManual: true });
  const handleObservacion = (idx: number, texto: string) => actualizarNino(idx, { observacionDescriptiva: texto });

  const reiniciarNinos = () => setNinos(ninosPorDefecto());

  const exportar = async (soloMolde: boolean) => {
    if (!competenciaInfo) return;
    const molde: MoldeGuardado = { competenciaId, actividad, unidad, fecha, criterio, items, capacidadesTexto };
    const registros: RegistroAlumno[] = soloMolde
      ? []
      : ninos.map((n) => ({
          nombre: n.nombre,
          calificaciones: n.calificaciones,
          nivelAlcanzado: n.nivelAlcanzado,
          observacionDescriptiva: n.observacionDescriptiva,
        }));
    await generarExcelEvaluacion(competenciaInfo.archivo, molde, registros);
  };

  const guardarEnDrive = (): Promise<ResultadoGuardadoDrive> => {
    if (guardadoEnCurso.current) return guardadoEnCurso.current;

    const operacion = (async (): Promise<ResultadoGuardadoDrive> => {
    if (!competenciaInfo) {
      throw new Error('Competencia no encontrada.');
    }

    // Primero conservamos el comportamiento actual de la app.
    // Esto mantiene compatible /drive mientras todavía migramos
    // la lectura de evaluaciones desde localStorage hacia Google Drive.
    const ahora = new Date().toISOString();
    const id = evaluacionIdActual || crearId('eval');
    const creadoEn = creadoEnEvaluacion || ahora;

    // Para una ficha nueva, fijamos ID y fecha de creación antes de contactar
    // Drive. Un reintento tras una red inestable conserva el mismo registro.
    if (!evaluacionIdActual) {
      setEvaluacionIdActual(id);
      setCreadoEnEvaluacion(creadoEn);
    }

    const guardada: EvaluacionGuardada = {
      id,
      tituloActividad: actividad,
      unidad,
      fecha,
      areaNombre: competenciaInfo.area,
      competenciaId,
      competenciaNombre: competenciaInfo.nombre,
      criterio,
      capacidadesTexto,
      indicadores: items,
      ninos,
      creadoEn,
      actualizadoEn: ahora,
    };

    const molde: MoldeGuardado = {
      competenciaId,
      actividad,
      unidad,
      fecha,
      criterio,
      items,
      capacidadesTexto,
    };

    const registros: RegistroAlumno[] = ninos.map((n) => ({
      nombre: n.nombre,
      calificaciones: n.calificaciones,
      nivelAlcanzado: n.nivelAlcanzado,
      observacionDescriptiva: n.observacionDescriptiva,
    }));

    // Generamos exactamente el mismo Excel que se descarga desde la app,
    // pero en Base64 para enviarlo al backend de Next.js.
    const excelBase64 = await generarExcelBase64(
      competenciaInfo.archivo,
      molde,
      registros
    );

    const response = await fetch('/api/drive/guardar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evaluacion: guardada,
        excelBase64,
      }),
    });

    const texto = await response.text();

    let resultado: {
      ok?: boolean;
      error?: string;
      evaluacionId?: string;
      json?: { id: string; nombre: string } | null;
      excel?: { id: string; nombre: string } | null;
    };

    try {
      resultado = JSON.parse(texto);
    } catch {
      throw new Error(
        'El servidor respondió con un formato inesperado al guardar en Google Drive.'
      );
    }

    if (!response.ok || !resultado.ok) {
      throw new Error(
        resultado.error || 'No se pudo guardar la evaluación en Google Drive.'
      );
    }

    // Solo eliminamos los borradores cuando Google Drive confirmó
    // que el guardado terminó correctamente.
    if (evaluacionIdActual) {
      guardarJSON(claveBorrador(evaluacionIdActual), null);
    }

    guardarJSON(claveBorrador(guardada.id), null);

    setEvaluacionIdActual(guardada.id);
    setCreadoEnEvaluacion(guardada.creadoEn);

    return {
      ...guardada,
      drive: resultado,
    };
    })();

    guardadoEnCurso.current = operacion;
    const liberar = () => {
      if (guardadoEnCurso.current === operacion) {
        guardadoEnCurso.current = null;
      }
    };
    void operacion.then(liberar, liberar);

    return operacion;
  };

  const finalizarSesion = () => {
    const moldeReset: MoldeGuardado = { competenciaId, actividad: '', unidad: '', fecha: '', criterio, items, capacidadesTexto };
    guardarJSON(`molde_${competenciaId}`, moldeReset);
    const ninosReset = ninosPorDefecto();
    guardarJSON(`sesion_${competenciaId}`, ninosReset);
    setActividad('');
    setUnidad('');
    setFecha('');
    setNinos(ninosReset);
    setEvaluacionIdActual(undefined);
  };

  const obtenerAdvertencias = (): string[] => {
    const advertencias: string[] = [];
    const conNombre = ninos.filter((n) => n.nombre.trim() !== '');
    if (conNombre.length === 0) {
      advertencias.push('No has escrito el nombre de ningún niño.');
      return advertencias;
    }
    const sinCalificar = conNombre.filter((n) => n.calificaciones.every((c) => !c));
    if (sinCalificar.length === conNombre.length) {
      advertencias.push('Ningún niño tiene calificaciones todavía.');
    } else if (sinCalificar.length > 0) {
      advertencias.push(`Estos niños aún no tienen ninguna calificación: ${sinCalificar.map((n) => n.nombre).join(', ')}.`);
    }
    if (!actividad.trim()) advertencias.push('No has escrito el nombre de la actividad.');
    if (!unidad.trim()) advertencias.push('No has escrito el nombre de la unidad.');
    if (!fecha.trim()) advertencias.push('No has elegido una fecha.');
    if (indicadoresActivos.length === 0) advertencias.push('No hay indicadores con texto para calificar.');
    if (filasPlantilla > 0 && indicadoresActivos.length > filasPlantilla) {
      const sobrantes = indicadoresActivos.length - filasPlantilla;
      advertencias.push(
        `Tienes ${indicadoresActivos.length} indicadores con texto, pero la plantilla física solo tiene ${filasPlantilla} filas. Los últimos ${sobrantes} no aparecerán en el Excel.`
      );
    }
    return advertencias;
  };

  return {
    competenciaInfo,
    evaluacionIdActual,
    guardarEnDrive,
    finalizarSesion,
    unidadPredefinida,
    cargarUnidadPredefinida,
    actividad,
    setActividad,
    unidad,
    setUnidad,
    fecha,
    setFecha,
    criterio,
    setCriterio,
    items,
    handleItemChange,
    eliminarIndicador,
    agregarIndicador,
    filasPlantilla,
    competenciaTexto,
    capacidadesTexto,
    setCapacidadesTexto,
    cargando,
    error,
    guardadoMoldeEn,
    guardadoNinosEn,
    restaurarPlantillaOriginal,
    ninos,
    indicadoresActivos,
    alumnosDisponibles,
    agregarNino,
    agregarNinoDesdeLista,
    eliminarNino,
    handleNombreChange,
    handleCalificacion,
    handleNivelManual,
    handleObservacion,
    reiniciarNinos,
    exportar,
    obtenerAdvertencias,
  };
}

export type UseFichaResult = ReturnType<typeof useFicha>;
