'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { generarExcelEvaluacion, leerEstructuraPlantilla } from '@/lib/excel';
import { getCompetencia, MAX_NINOS } from '@/lib/competencias';
import { crearId } from '@/lib/roster';
import { leerJSON, guardarJSON } from '@/lib/storage';
import { useListaAlumnos } from '@/lib/useListaAlumnos';
import { obtenerEvaluacion, guardarEvaluacion } from '@/lib/evaluaciones';
import { CONTENIDO_OFICIAL } from '@/lib/contenidoOficial';
import { UNIDADES_PREDEFINIDAS } from '@/lib/unidadesPredefinidas';
import { MoldeGuardado, Nivel, NinoGuardado, RegistroAlumno } from '@/types';

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
    listoParaGuardar.current = false;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        if (!competenciaInfo) {
          setError('Competencia no encontrada.');
          return;
        }
        const estructura = await leerEstructuraPlantilla(competenciaInfo.archivo);
        if (cancelado) return;

        const oficial = CONTENIDO_OFICIAL[competenciaId];
        setCompetenciaTexto(oficial?.competenciaTexto ?? estructura.competenciaTexto);
        const capacidadesPorDefecto = oficial?.capacidadesTexto ?? estructura.capacidadesTexto;
        const criterioPorDefecto = oficial?.criterioTexto ?? estructura.criterioDefault;
        setFilasPlantilla(estructura.indicadoresDefault.length);

        const evaluacionExistente = evaluacionIdAEditar ? obtenerEvaluacion(evaluacionIdAEditar) : null;

        if (evaluacionExistente) {
          setActividad(evaluacionExistente.tituloActividad);
          setUnidad(evaluacionExistente.unidad || '');
          setFecha(evaluacionExistente.fecha);
          setCriterio(evaluacionExistente.criterio || criterioPorDefecto);
          setCapacidadesTexto(evaluacionExistente.capacidadesTexto || capacidadesPorDefecto);
          setItems(
            evaluacionExistente.indicadores?.length > 0
              ? evaluacionExistente.indicadores
              : estructura.indicadoresDefault
          );
          setNinos(evaluacionExistente.ninos.length > 0 ? evaluacionExistente.ninos : ninosPorDefecto());
          setEvaluacionIdActual(evaluacionExistente.id);
        } else {
          const guardado = leerJSON<MoldeGuardado | null>(`molde_${competenciaId}`, null);
          const tieneItemsGuardados = !!(guardado?.items?.length);

          if (tieneItemsGuardados && guardado) {
            setActividad(guardado.actividad || '');
            setUnidad(guardado.unidad || '');
            setFecha(guardado.fecha || '');
            setCriterio(guardado.criterio || criterioPorDefecto);
            setItems(guardado.items);
            setCapacidadesTexto(guardado.capacidadesTexto || capacidadesPorDefecto);
          } else {
            setActividad('');
            setUnidad('');
            setFecha('');
            setCriterio(criterioPorDefecto);
            setItems(estructura.indicadoresDefault);
            setCapacidadesTexto(capacidadesPorDefecto);
          }

          const sesionGuardada = leerJSON<NinoGuardado[] | null>(`sesion_${competenciaId}`, null);
          if (sesionGuardada && sesionGuardada.length > 0) {
            setNinos(sesionGuardada);
          } else {
            setNinos(ninosPorDefecto());
          }

          setEvaluacionIdActual(undefined);
        }
      } catch (e) {
        console.error(e);
        if (!cancelado) setError('No se pudo leer la plantilla. Verifica que el archivo exista en /public/plantillas.');
      } finally {
        if (!cancelado) {
          setCargando(false);
          setTimeout(() => {
            listoParaGuardar.current = true;
          }, 0);
        }
      }
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, [competenciaId, evaluacionIdAEditar]);

  useEffect(() => {
    if (!listoParaGuardar.current) return;
    const timer = setTimeout(() => {
      const molde: MoldeGuardado = { competenciaId, actividad, unidad, fecha, criterio, items, capacidadesTexto };
      guardarJSON(`molde_${competenciaId}`, molde);
      setGuardadoMoldeEn(Date.now());
    }, 600);
    return () => clearTimeout(timer);
  }, [competenciaId, actividad, unidad, fecha, criterio, items, capacidadesTexto]);

  useEffect(() => {
    if (!listoParaGuardar.current) return;
    const timer = setTimeout(() => {
      guardarJSON(`sesion_${competenciaId}`, ninos);
      setGuardadoNinosEn(Date.now());
    }, 600);
    return () => clearTimeout(timer);
  }, [competenciaId, ninos]);

  const unidadPredefinida = UNIDADES_PREDEFINIDAS[competenciaId];

  const cargarUnidadPredefinida = (): { aplicados: number; total: number } | null => {
    if (!unidadPredefinida) return null;
    const total = unidadPredefinida.indicadores.length;
    const aplicados = Math.min(items.length, total);
    setCriterio(unidadPredefinida.criterio);
    setItems((prev) => prev.map((texto, i) => unidadPredefinida.indicadores[i] ?? texto));
    return { aplicados, total };
  };

  const restaurarPlantillaOriginal = async () => {
    if (!competenciaInfo) return;
    const estructura = await leerEstructuraPlantilla(competenciaInfo.archivo);
    const oficial = CONTENIDO_OFICIAL[competenciaId];
    const criterioOriginal = oficial?.criterioTexto ?? estructura.criterioDefault;
    const capacidadesOriginales = oficial?.capacidadesTexto ?? estructura.capacidadesTexto;
    setCriterio(criterioOriginal);
    setCapacidadesTexto(capacidadesOriginales);
    setItems(estructura.indicadoresDefault);
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
    // CORRECCIÓN 2: Asegurar que capacidadesTexto se incluya al exportar/generar el excel
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

  const guardarEnDrive = () => {
    if (!competenciaInfo) return null;
    const guardada = guardarEvaluacion({
      id: evaluacionIdActual,
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
    });
    setEvaluacionIdActual(guardada.id);
    return guardada;
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