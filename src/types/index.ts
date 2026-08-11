export type Nivel = 'L' | 'EP' | 'I' | '';

/** Molde guardado por el docente para una competencia (persistido en localStorage) */
export interface MoldeGuardado {
  competenciaId: string;
  actividad: string;
  unidad: string;
  fecha: string;
  criterio: string;
  /** Un texto por cada fila de indicador que la plantilla física tiene disponible */
  items: string[];
  /** Texto de "capacidades" editable por el docente; si no está, se autocompleta con el oficial */
  capacidadesTexto?: string;
}

/** Registro de un niño evaluado: una calificación por cada indicador del molde + resumen descriptivo */
export interface RegistroAlumno {
  nombre: string;
  calificaciones: Nivel[];
  nivelAlcanzado: Nivel;
  observacionDescriptiva: string;
}

/** Estructura física detectada al leer una plantilla .xlsx real */
export interface EstructuraPlantilla {
  competenciaTexto: string;
  capacidadesTexto: string;
  criterioDefault: string;
  indicadoresDefault: string[];
  indicatorStartRow: number;
  legendRow: number;
  registroDescRow: number;
  headerNinoRow: number;
  dataStartRow: number;
  maxRow: number;
  maxNinos: number;
}

/** Un alumno de la lista maestra del docente (persiste entre todas las competencias) */
export interface Alumno {
  id: string;
  nombre: string;
  dni?: string;
}

/**
 * Estado de un niño dentro de la sesión de UNA competencia.
 *
 * `asistencia` es opcional para mantener compatibilidad con evaluaciones antiguas:
 * - undefined o 'presente' = comportamiento normal.
 * - 'falto' = no asistió a la sesión; no se le asignan L / EP / I.
 */
export interface NinoGuardado {
  id: string;
  alumnoId: string | null;
  nombre: string;
  calificaciones: Nivel[];
  nivelAlcanzado: Nivel;
  nivelManual: boolean;
  observacionDescriptiva: string;
  asistencia?: 'presente' | 'falto';
}

/**
 * Una ficha de evaluación ya completada y guardada en Drive.
 */
export interface EvaluacionGuardada {
  id: string;
  tituloActividad: string;
  unidad?: string;
  fecha: string; // YYYY-MM-DD
  areaNombre: string;
  competenciaId: string;
  competenciaNombre: string;
  criterio: string;
  capacidadesTexto?: string;
  indicadores: string[];
  ninos: NinoGuardado[];
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
}