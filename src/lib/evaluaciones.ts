import { EvaluacionGuardada } from '@/types';
import { leerJSON, guardarJSON } from './storage';
import { crearId } from './roster';

const CLAVE = 'evaluaciones_guardadas_v1';

export function listarEvaluaciones(): EvaluacionGuardada[] {
  return leerJSON<EvaluacionGuardada[]>(CLAVE, []);
}

export function obtenerEvaluacion(id: string): EvaluacionGuardada | null {
  return listarEvaluaciones().find((e) => e.id === id) ?? null;
}

/** Crea o actualiza (según si `id` ya existe en el historial) */
export function guardarEvaluacion(datos: Omit<EvaluacionGuardada, 'id' | 'creadoEn' | 'actualizadoEn'> & { id?: string }): EvaluacionGuardada {
  const lista = listarEvaluaciones();
  const ahora = new Date().toISOString();
  const idx = datos.id ? lista.findIndex((e) => e.id === datos.id) : -1;

  if (idx >= 0) {
    const actualizada: EvaluacionGuardada = { ...lista[idx], ...datos, id: lista[idx].id, actualizadoEn: ahora };
    lista[idx] = actualizada;
    guardarJSON(CLAVE, lista);
    return actualizada;
  }

  const nueva: EvaluacionGuardada = { ...datos, id: datos.id || crearId('eval'), creadoEn: ahora, actualizadoEn: ahora };
  guardarJSON(CLAVE, [...lista, nueva]);
  return nueva;
}

export function eliminarEvaluacion(id: string): void {
  guardarJSON(
    CLAVE,
    listarEvaluaciones().filter((e) => e.id !== id)
  );
}