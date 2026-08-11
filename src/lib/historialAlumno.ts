import {
  Alumno,
  EvaluacionGuardada,
  NinoGuardado,
} from '@/types';
import { buscarRegistroAlumno } from '@/lib/alumnoMatch';

export interface HistorialAlumnoItem {
  evaluacionId: string;
  fecha: string;
  area: string;
  competenciaId: string;
  competenciaNombre: string;
  actividad: string;
  unidad: string;
  nivelAlcanzado: NinoGuardado['nivelAlcanzado'];
  observacionDescriptiva: string;
  indicadores: string[];
  calificaciones: NinoGuardado['calificaciones'];
}

export function construirHistorialAlumno(
  alumno: Alumno,
  evaluaciones: EvaluacionGuardada[]
): HistorialAlumnoItem[] {
  return evaluaciones
    .map((evaluacion) => {
      const registro = buscarRegistroAlumno(
        evaluacion,
        alumno
      );

      if (!registro) {
        return null;
      }

      return {
        evaluacionId: evaluacion.id,
        fecha: evaluacion.fecha || '',
        area: evaluacion.areaNombre || '',
        competenciaId: evaluacion.competenciaId || '',
        competenciaNombre:
          evaluacion.competenciaNombre || '',
        actividad:
          evaluacion.tituloActividad || '',
        unidad:
          evaluacion.unidad || '',
        nivelAlcanzado:
          registro.nivelAlcanzado,
        observacionDescriptiva:
          registro.observacionDescriptiva || '',
        indicadores:
          evaluacion.indicadores || [],
        calificaciones:
          registro.calificaciones || [],
      } satisfies HistorialAlumnoItem;
    })
    .filter(
      (
        item
      ): item is HistorialAlumnoItem =>
        item !== null
    )
    .sort((a, b) =>
      b.fecha.localeCompare(a.fecha)
    );
}