import {
  Alumno,
  EvaluacionGuardada,
  NinoGuardado,
} from '@/types';

/**
 * Normaliza un nombre para poder comparar registros antiguos
 * aunque existan diferencias de mayúsculas, tildes o espacios.
 */
function normalizarNombre(nombre: string): string {
  return (nombre || '')
    .trim()
    .toLocaleUpperCase('es-PE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Determina si un registro de niño pertenece a un alumno.
 *
 * Prioridad:
 * 1. Coincidencia exacta por alumnoId.
 * 2. Coincidencia exacta por nombre normalizado como
 *    compatibilidad para evaluaciones antiguas.
 */
export function coincideAlumno(
  alumno: Alumno,
  nino: NinoGuardado
): boolean {
  if (!alumno || !nino) {
    return false;
  }

  // -------------------------------------------------------
  // 1. Coincidencia por ID
  // -------------------------------------------------------
  if (
    nino.alumnoId &&
    String(nino.alumnoId) === String(alumno.id)
  ) {
    return true;
  }

  // -------------------------------------------------------
  // 2. Compatibilidad por nombre
  // -------------------------------------------------------
  const nombreAlumno = normalizarNombre(
    alumno.nombre || ''
  );

  const nombreNino = normalizarNombre(
    nino.nombre || ''
  );

  if (!nombreAlumno || !nombreNino) {
    return false;
  }

  return nombreAlumno === nombreNino;
}

/**
 * Busca dentro de UNA evaluación el registro correspondiente
 * al alumno indicado.
 *
 * Se usa tanto en:
 * - Gestión de Alumnos
 * - Drive
 * - Reporte consolidado del alumno
 */
export function buscarRegistroAlumno(
  evaluacion: EvaluacionGuardada,
  alumno: Alumno
): NinoGuardado | undefined {
  if (
    !evaluacion ||
    !Array.isArray(evaluacion.ninos)
  ) {
    return undefined;
  }

  return evaluacion.ninos.find((nino) =>
    coincideAlumno(alumno, nino)
  );
}