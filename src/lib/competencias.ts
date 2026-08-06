export interface CompetenciaInfo {
  id: string;
  nombre: string;
  area: string;
  archivo: string;
}

export const COMPETENCIAS: CompetenciaInfo[] = [
  { id: 'COM_COMUNICA', nombre: 'Se comunica oralmente', area: 'Comunicación', archivo: 'COMUNICACION_SE_COMUNICA.xlsx' },
  { id: 'COM_LEE', nombre: 'Lee diversos tipos de textos', area: 'Comunicación', archivo: 'COMUNICACION_LEE.xlsx' },
  { id: 'COM_CREA', nombre: 'Crea proyectos desde los lenguajes artísticos', area: 'Comunicación', archivo: 'COMUNICACION_CREA.xlsx' },
  { id: 'MAT_CANTIDAD', nombre: 'Resuelve problemas de cantidad', area: 'Matemática', archivo: 'MATEMATICA_CANTIDAD.xlsx' },
  { id: 'MAT_MOVIMIENTO', nombre: 'Resuelve problemas de forma, movimiento y localización', area: 'Matemática', archivo: 'MATEMATICA_MOVIMIENTO.xlsx' },
  { id: 'PS_IDENTIDAD', nombre: 'Construye su identidad', area: 'Personal Social', archivo: 'PERSONAL_SOCIAL_IDENTIDAD.xlsx' },
  { id: 'PS_CONVIVE', nombre: 'Convive y participa democráticamente', area: 'Personal Social', archivo: 'PERSONAL_SOCIAL_CONVIVE.xlsx' },
  { id: 'CT_INDAGA', nombre: 'Indaga mediante métodos científicos', area: 'Ciencia', archivo: 'CIENCIA_INDAGA.xlsx' },
  { id: 'PSI_MOTRICIDAD', nombre: 'Se desenvuelve de manera autónoma a través de su motricidad', area: 'Psicomotricidad', archivo: 'PSICOMOTRICIDAD_PSICO.xlsx' },
];

export function getCompetencia(id: string): CompetenciaInfo | undefined {
  return COMPETENCIAS.find((c) => c.id === id);
}

// Capacidad máxima de la plantilla física: 5 niños por ficha (columnas D-H y 5 filas de registro descriptivo)
export const MAX_NINOS = 5;