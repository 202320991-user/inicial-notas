import { Alumno } from '@/types';
import { leerJSON, guardarJSON } from './storage';

const CLAVE_LISTA = 'lista_alumnos_v1';

export function cargarListaAlumnos(): Alumno[] {
  return leerJSON<Alumno[]>(CLAVE_LISTA, []);
}

export function guardarListaAlumnos(lista: Alumno[]): void {
  guardarJSON(CLAVE_LISTA, lista);
}

/** Id simple, suficiente para uso local (no hay backend ni concurrencia entre usuarios) */
export function crearId(prefijo: string): string {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}