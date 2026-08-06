import { leerJSON, eliminarClave } from '@/lib/storage';
import { NinoGuardado } from '@/types';

/** ¿Hay datos de niños sin guardar en el Drive para esta competencia? */
export function haySesionSinGuardar(competenciaId: string): boolean {
  const sesion = leerJSON<NinoGuardado[]>(`sesion_${competenciaId}`, []);
  return sesion.some((n) => n.nombre.trim() !== '' || n.calificaciones.some(Boolean) || n.observacionDescriptiva.trim() !== '');
}

/** Descarta la sesión de trabajo en curso (no toca nada ya guardado en el Drive) */
export function descartarSesion(competenciaId: string): void {
  eliminarClave(`sesion_${competenciaId}`);
}