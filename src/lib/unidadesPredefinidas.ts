import { CONTENIDO_OFICIAL } from './contenidoOficial';

export interface UnidadPredefinida {
  titulo: string;
  criterio: string;
  indicadores: string[];
}

/**
 * Títulos oficiales por competencia.
 */
const TITULOS_OFICIALES: Record<string, string> = {
  COM_COMUNICA: 'Unidad Oficial: Se comunica oralmente',
  COM_LEE: 'Unidad Oficial: Lee diversos tipos de textos',
  COM_CREA: 'Unidad Oficial: Crea proyectos artísticos',
  MAT_CANTIDAD: 'Unidad Oficial: Resuelve problemas de cantidad',
  MAT_MOVIMIENTO: 'Unidad Oficial: Forma, movimiento y localización',
  PS_IDENTIDAD: 'Unidad Oficial: Construye su identidad',
  PS_CONVIVE: 'Unidad Oficial: Convive y participa democráticamente',
  PSI_MOTRICIDAD: 'Unidad Oficial: Se desenvuelve con motricidad',
  CT_INDAGA: 'Unidad Oficial: Indaga mediante métodos científicos',
};

/**
 * UNIDADES_PREDEFINIDAS generadas dinámicamente desde la ÚNICA fuente oficial (CONTENIDO_OFICIAL).
 * De esta manera, "Cargar unidad" y "Restaurar originales" SIEMPRE tendrán los mismos datos exactos del Excel.
 */
export const UNIDADES_PREDEFINIDAS: Record<string, UnidadPredefinida> = Object.entries(
  CONTENIDO_OFICIAL
).reduce((acc, [key, val]) => {
  acc[key] = {
    titulo: TITULOS_OFICIALES[key] ?? 'Unidad Oficial CNEB',
    criterio: val.criterioTexto ?? '',
    indicadores: val.indicadores ?? [],
  };
  return acc;
}, {} as Record<string, UnidadPredefinida>);