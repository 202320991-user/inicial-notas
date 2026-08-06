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
 * Estado de un niño dentro de la sesión de UNA competencia (se persiste por competencia
 * para que cambiar de competencia no mezcle calificaciones de indicadores distintos).
 * Si `alumnoId` referencia a un alumno de la lista maestra, o es null si el nombre
 * se escribió libremente sin vincularlo a la lista.
 */
export interface NinoGuardado {
  id: string;
  alumnoId: string | null;
  nombre: string;
  calificaciones: Nivel[];
  nivelAlcanzado: Nivel;
  nivelManual: boolean;
  observacionDescriptiva: string;
}

/**
 * Una ficha de evaluación ya completada y guardada en el "Drive" (historial).
 * Reutiliza `NinoGuardado` tal cual (en vez de un formato `resultados: Record<number,...>`
 * separado) para no mantener dos vocabularios distintos de lo mismo en el código.
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