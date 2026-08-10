import { Alumno } from '@/types';
import { leerJSON, guardarJSON } from './storage';

const CLAVE_LISTA = 'lista_alumnos_v1';

/**
 * Alumnos precargados para la primera prueba en aula.
 *
 * IMPORTANTE:
 * - Los IDs son FIJOS.
 * - Solo se usarán si el navegador todavía no tiene una lista guardada.
 * - No se reemplaza una lista existente.
 */
const ALUMNOS_INICIALES: Alumno[] = [
  {
    id: 'al_001',
    nombre: 'AGREDA ROJAS JEFFERSON DAVID',
  },
  {
    id: 'al_002',
    nombre: 'ALCARRAZ CHUMBE ANDREA VALENTINA',
  },
  {
    id: 'al_003',
    nombre: 'ALFARO LOAYZA LUKE PATRICK EVANS',
  },
  {
    id: 'al_004',
    nombre: 'BENITO PACAYA JORGE MILAN',
  },
  {
    id: 'al_005',
    nombre: 'CALDERON CABALLERO KASSIA ADALETT',
  },
  {
    id: 'al_006',
    nombre: 'CASA ESPIRILLA THIAGO YAIR',
  },
  {
    id: 'al_007',
    nombre: 'CORTIJO ESCALANTE VASKO KERIM',
  },
  {
    id: 'al_008',
    nombre: 'CORZO VILLANUEVA MARIA JOSE CARMEN',
  },
  {
    id: 'al_009',
    nombre: 'GARCIA MORANTE EVANS GADIEL',
  },
  {
    id: 'al_010',
    nombre: 'GARCIA RETAMOZO LEONARDO SEBASTIAN',
  },
  {
    id: 'al_011',
    nombre: 'GARCIA YOVERA LUHANA GUADALUPE',
  },
  {
    id: 'al_012',
    nombre: 'LEDESMA MORAYA MATEO SMITH',
  },
  {
    id: 'al_013',
    nombre: 'LEON PFUTURI ARYA ROSA',
  },
  {
    id: 'al_014',
    nombre: 'LULO PECHO CAMILO BENJAMIN',
  },
  {
    id: 'al_015',
    nombre: 'PARRA CHILON JANIS ALEJANDRA',
  },
  {
    id: 'al_016',
    nombre: 'PORTILLA BARRIOS ADAM LUCIANO',
  },
  {
    id: 'al_017',
    nombre: 'QUISPE MORALES HARVEY SEBASTIAN',
  },
  {
    id: 'al_018',
    nombre: 'RONCALLA TAPULLIMA ALICE MANUELITA',
  },
  {
    id: 'al_019',
    nombre: 'TORRES ISLA CITLIALLY',
  },
  {
    id: 'al_020',
    nombre: 'UNOC ZEVALLOS LIAM MATEO',
  },
  {
    id: 'al_021',
    nombre: 'URBINA YOVERA EMMA VALENTINA',
  },
  {
    id: 'al_022',
    nombre: 'YACTAYO GONZALES PERCY GAEL',
  },
];

/**
 * Carga la lista de alumnos.
 *
 * Si ya existe una lista guardada en localStorage,
 * se respeta esa lista.
 *
 * Si el navegador es nuevo y todavía no tiene alumnos,
 * se cargan automáticamente ALUMNOS_INICIALES.
 */
export function cargarListaAlumnos(): Alumno[] {
  const listaGuardada = leerJSON<Alumno[]>(
    CLAVE_LISTA,
    []
  );

  if (listaGuardada.length > 0) {
    return listaGuardada;
  }

  guardarJSON(
    CLAVE_LISTA,
    ALUMNOS_INICIALES
  );

  return ALUMNOS_INICIALES;
}

/**
 * Guarda la lista completa de alumnos.
 */
export function guardarListaAlumnos(
  lista: Alumno[]
): void {
  guardarJSON(
    CLAVE_LISTA,
    lista
  );
}

/**
 * Genera un ID para alumnos nuevos
 * creados manualmente desde la aplicación.
 */
export function crearId(
  prefijo: string
): string {
  return `${prefijo}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}